// ═══════════════════════════════════════════════════════════
// FRI — Forecasting Resilience Index
// The master variable that modulates ALL DIG outputs
//
// Low FRI → conservative, cautious, risk-heavy output
// High FRI → confident, direct, aggressive output
// ═══════════════════════════════════════════════════════════

const { getStats } = require('./feedback-store');

/**
 * FRI Weights — how much each factor contributes
 */
const WEIGHTS = {
  satisfaction: 0.35,  // User approval rate
  trend: 0.25,         // Improvement trajectory
  volume: 0.20,        // Data reliability (more data = better signal)
  consistency: 0.20,   // Stability (no sudden drops)
};

/**
 * FRI Levels and their modulation profiles
 */
const FRI_PROFILES = {
  CRITICAL: {
    level: 'CRITICAL',
    icon: '🔴',
    range: [0, 39],
    color: '#ef4444',
    description: 'System underperforming. Maximum caution.',
    promptInstruction:
      'You are in FRI-CRITICAL mode. Your recent performance has been poor. ' +
      'This response must be extremely careful and methodical. ' +
      'Every action MUST have a verification prerequisite. ' +
      'Preface uncertain recommendations with explicit reasoning. ' +
      'Never suggest more than 2 actions at once. ' +
      'Confidence ceiling: 60. Be humble but precise.',
    confidenceModifier: -15,
    riskExpansion: 3,
    maxActions: 2,
    aggressivenessMultiplier: 0.4,
    extraVerifySteps: true,
  },
  STABILIZING: {
    level: 'STABILIZING',
    icon: '🟡',
    range: [40, 64],
    color: '#eab308',
    description: 'Mixed signals. Proceed with extra caution.',
    promptInstruction:
      'You are in FRI-STABILIZING mode. Recent performance has been inconsistent. ' +
      'Be cautious. Add verification steps to critical actions. ' +
      'Double your risk analysis depth. If unsure, recommend the safer path. ' +
      'Confidence ceiling: 75.',
    confidenceModifier: -8,
    riskExpansion: 2,
    maxActions: 4,
    aggressivenessMultiplier: 0.7,
    extraVerifySteps: true,
  },
  HEALTHY: {
    level: 'HEALTHY',
    icon: '🔵',
    range: [65, 84],
    color: '#3b82f6',
    description: 'Performing well. Room to push harder.',
    promptInstruction:
      'You are in FRI-HEALTHY mode. Your analysis is generally trusted. ' +
      'Be confident but add one verification step to the most critical action. ' +
      'You can suggest aggressive optimization paths when justified. ' +
      'Confidence ceiling: 88.',
    confidenceModifier: -2,
    riskExpansion: 1,
    maxActions: 5,
    aggressivenessMultiplier: 1.0,
    extraVerifySteps: false,
  },
  OPTIMAL: {
    level: 'OPTIMAL',
    icon: '🟢',
    range: [85, 100],
    color: '#22c55e',
    description: 'Excellence earned. Trust is high.',
    promptInstruction:
      'You are in FRI-OPTIMAL mode. Your analysis is well-calibrated and trusted. ' +
      'Be direct, confident, and aggressive in recommendations. ' +
      'No unnecessary hedging or disclaimers. ' +
      'Confidence ceiling: 95. Go deep when depth is needed.',
    confidenceModifier: 0,
    riskExpansion: 0,
    maxActions: 6,
    aggressivenessMultiplier: 1.2,
    extraVerifySteps: false,
  },
};

/**
 * Calculate the 4 FRI factors
 */

// Factor 1: Satisfaction Score (0-100)
function calcSatisfaction(total, ups) {
  if (total === 0) return 70; // neutral default
  return Math.round((ups / total) * 100);
}

// Factor 2: Trend Score (0-100)
function calcTrend(total, ups, downs) {
  if (total < 4) return 65;

  const rate = total > 0 ? ups / total : 0.5;

  if (rate > 0.85) return 95;
  if (rate > 0.75) return 85;
  if (rate > 0.65) return 75;
  if (rate > 0.50) return 55;
  if (rate > 0.35) return 35;
  return 15;
}

// Factor 3: Volume Score (0-100) — more data = more reliable
function calcVolume(total) {
  if (total === 0) return 50;
  if (total <= 3) return 25;
  if (total <= 5) return 35;
  if (total <= 10) return 50;
  if (total <= 20) return 65;
  if (total <= 50) return 80;
  if (total <= 100) return 90;
  return 100;
}

// Factor 4: Consistency Score (0-100)
function calcConsistency(negativeAlert, recentNegCount, total) {
  if (negativeAlert) return Math.max(10, 55 - recentNegCount * 5);
  if (total > 5) return 85;
  return 70;
}

/**
 * Main FRI calculation
 */
function calculateFRI() {
  const stats = getStats();
  const { total, ups, downs, last24h, recentNegatives, negativeAlert } = stats;

  const satisfaction = calcSatisfaction(total, ups);
  const trend = calcTrend(total, ups, downs);
  const volume = calcVolume(total);
  const consistency = calcConsistency(negativeAlert, recentNegatives.length, total);

  const raw = Math.round(
    satisfaction * WEIGHTS.satisfaction +
    trend * WEIGHTS.trend +
    volume * WEIGHTS.volume +
    consistency * WEIGHTS.consistency
  );

  const score = Math.max(0, Math.min(100, raw));
  const profile = getFRIProfile(score);

  return {
    score,
    level: profile.level,
    icon: profile.icon,
    color: profile.color,
    description: profile.description,
    breakdown: { satisfaction, trend, volume, consistency },
    profile: {
      promptInstruction: profile.promptInstruction,
      confidenceModifier: profile.confidenceModifier,
      riskExpansion: profile.riskExpansion,
      maxActions: profile.maxActions,
      aggressivenessMultiplier: profile.aggressivenessMultiplier,
      extraVerifySteps: profile.extraVerifySteps,
    },
    stats: {
      totalInteractions: total,
      ups,
      downs,
      satisfactionRate: total > 0 ? Math.round((ups / total) * 100) : 0,
      last24h,
      negativeAlert,
      negativeCount: recentNegatives.length,
    },
  };
}

function getFRIProfile(score) {
  for (const key of Object.keys(FRI_PROFILES)) {
    const p = FRI_PROFILES[key];
    if (score >= p.range[0] && score <= p.range[1]) return p;
  }
  return FRI_PROFILES.HEALTHY;
}

module.exports = { calculateFRI, getFRIProfile, FRI_PROFILES, WEIGHTS };
