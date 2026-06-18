// ═══════════════════════════════════════════════════════════
// FRI — Forecasting Resilience Index v3.0
// Multi-Signal Skepticism Engine
//
// v2.0: satisfaction + trend + volume + consistency
// v3.0: + model_confidence + arg_impact + response_quality
//
// FRI adalah mekanisme audit diri yang konstan:
// "Apakah yang saya katakan ini benar, atau hanya yang aman untuk dikatakan?"
// ═══════════════════════════════════════════════════════════

const { getStats } = require('./feedback-store');

/**
 * FRI Weights v3.0 — Multi-Signal
 * Total = 1.0
 */
const WEIGHTS = {
  // Signal 1-4: From user feedback (legacy)
  satisfaction: 0.20,  // User approval rate
  trend: 0.15,         // Improvement trajectory
  volume: 0.10,        // Data reliability
  consistency: 0.10,   // Stability
  // Signal 5: Model self-assessment
  modelConfidence: 0.20, // How confident the model reported being
  // Signal 6: ARG adversarial score
  argImpact: 0.15,     // How much ARG had to correct
  // Signal 7: Response quality proxy
  responseQuality: 0.10, // Token efficiency + completion quality
};

/**
 * FRI Levels — DIG-TWO v5.0 with Anti-Sensor philosophy
 */
const FRI_PROFILES = {
  CRITICAL: {
    level: 'CRITICAL',
    icon: '🔴',
    range: [0, 39],
    color: '#ef4444',
    description: 'Performa rendah. Skeptisisme maksimal.',
    promptInstruction:
      'FRI CRITICAL — Audit diri sangat ketat. ' +
      'Keraguan harus hadir di setiap klaim. ' +
      'Pertanyakan semua asumsi dasar: "Apakah ini fakta, atau hanya yang aman dikatakan?" ' +
      'Pangkas semua prediksi berlebihan. Jangan lebih dari 2 aksi per respon. ' +
      'Jika ragu, pilih jalur yang lebih aman. ' +
      'Tetap ekspose Tribal Knowledge Bias jika terlihat, tapi dengan bukti kuat.',
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
    description: 'Sinyal campur. Skeptisisme aktif.',
    promptInstruction:
      'FRI STABILIZING — Kinerja tidak konsisten. ' +
      'Tingkatkan kedalaman verifikasi. Kalau tidak yakin, bilang secara natural. ' +
      'Analisis risiko lebih dalam dari biasanya. ' +
      'Cross-Linker harus aktif — connect ke domain yang lebih luas untuk memvalidasi. ' +
      'Jika ada Tribal Knowledge Bias, tunjukkan tapi dengan konteks.',
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
    description: 'Performa baik. Siap push lebih jauh.',
    promptInstruction:
      'FRI HEALTHY — Analisis umumnya terpercaya. ' +
      'Ambil posisi yang lebih tegas. Ekspos lebih banyak dari biasanya. ' +
      'Cross-Linker dan ARG harus aktif penuh. ' +
      'Tantang asumsi lebih agresif. Ekspos Tribal Knowledge Bias yang tersembunyi.',
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
    description: 'Excellence tercapai. Kepercayaan tinggi.',
    promptInstruction:
      'FRI OPTIMAL — Analisis well-calibrated dan terpercaya. ' +
      'Langsung ke inti. Prediksi berani, analisis disruptif. ' +
      'No unnecessary hedging. Ekspos semua yang tersembunyi. ' +
      'Kamu adalah auditor sistem AI yang paling tajam — buktikan.',
    confidenceModifier: 0,
    riskExpansion: 0,
    maxActions: 6,
    aggressivenessMultiplier: 1.2,
    extraVerifySteps: false,
  },
};

// ═══════════════════════════════════════════
// SIGNAL 1-4: User Feedback (legacy)
// ═══════════════════════════════════════════

function calcSatisfaction(total, ups) {
  if (total === 0) return 70;
  return Math.round((ups / total) * 100);
}

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

function calcConsistency(negativeAlert, recentNegCount, total) {
  if (negativeAlert) return Math.max(10, 55 - recentNegCount * 5);
  if (total > 5) return 85;
  return 70;
}

// ═══════════════════════════════════════════
// SIGNAL 5: Model Confidence
// Extracted from LLM completion (finish_reason, token usage, response pattern)
// ═══════════════════════════════════════════

function calcModelConfidence(completionData) {
  if (!completionData) return 60; // neutral default

  let score = 60; // baseline

  // finish_reason: "stop" = model completed naturally = good
  if (completionData.finishReason === 'stop') {
    score += 10;
  } else if (completionData.finishReason === 'length') {
    score -= 10; // truncated = may be uncertain or struggling
  }

  // Token efficiency: shorter answers on simple topics = efficient = good
  const tokens = completionData.totalTokens || 0;
  if (tokens > 0 && tokens < 200) score += 5;  // concise = confident
  if (tokens > 500) score -= 5;  // verbose may indicate hedging

  // Hedging language detection in raw output
  const text = (completionData.rawText || '').toLowerCase();
  const hedgeWords = ['mungkin', 'kemungkinan', 'sepertinya', 'agaknya', 'tidak yakin',
                      'perhaps', 'might', 'possibly', 'unclear', 'it depends'];
  const hedgeCount = hedgeWords.filter(w => text.includes(w)).length;
  score -= hedgeCount * 3;

  // Confidence language detection
  const confWords = ['pasti', 'jelas', 'definitif', 'terbukti', 'dikonfirmasi',
                     'definitely', 'certainly', 'clearly', 'established'];
  const confCount = confWords.filter(w => text.includes(w)).length;
  score += confCount * 2;

  return Math.max(0, Math.min(100, score));
}

// ═══════════════════════════════════════════
// SIGNAL 6: ARG Impact
// How much did ARG have to correct?
// ═══════════════════════════════════════════

function calcARGImpact(argResult) {
  if (!argResult || !argResult.attacked) return 60; // no ARG = neutral

  switch (argResult.impact) {
    case 'high':   return 30; // lots of correction needed = low score
    case 'medium': return 55; // some correction
    case 'low':    return 75; // minor notes
    default:       return 60;
  }
}

// ═══════════════════════════════════════════
// SIGNAL 7: Response Quality Proxy
// Length efficiency + structure quality
// ═══════════════════════════════════════════

function calcResponseQuality(rawText, targetDepth) {
  if (!rawText) return 50;

  const len = rawText.length;
  const depthTargets = {
    surface: { min: 100, max: 600, ideal: 300 },
    normal:  { min: 300, max: 1500, ideal: 800 },
    deep:    { min: 800, max: 3000, ideal: 1500 },
  };

  const target = depthTargets[targetDepth] || depthTargets.normal;

  let score = 60;

  if (len >= target.min && len <= target.max) {
    score += 15; // within range
  } else if (len < target.min) {
    score -= 15; // too short
  } else {
    score -= 5;  // slightly verbose
  }

  // Quality heuristics
  const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length >= 3) score += 5; // multi-sentence = structured
  if (sentences.length > 15) score -= 5; // too many = rambling

  return Math.max(0, Math.min(100, score));
}

// ═══════════════════════════════════════════
// MAIN FRI CALCULATION v3.0
// ═══════════════════════════════════════════

function calculateFRI(externalSignals = null) {
  const stats = getStats();
  const { total, ups, downs, last24h, recentNegatives, negativeAlert } = stats;

  // Signals 1-4: User feedback
  const satisfaction = calcSatisfaction(total, ups);
  const trend = calcTrend(total, ups, downs);
  const volume = calcVolume(total);
  const consistency = calcConsistency(negativeAlert, recentNegatives.length, total);

  // Signals 5-7: External (passed from engine after LLM + ARG calls)
  const modelConfidence = externalSignals?.modelConfidence ?? 60;
  const argImpact = externalSignals?.argImpact ?? 60;
  const responseQuality = externalSignals?.responseQuality ?? 60;

  // Weighted sum
  const raw = Math.round(
    satisfaction * WEIGHTS.satisfaction +
    trend * WEIGHTS.trend +
    volume * WEIGHTS.volume +
    consistency * WEIGHTS.consistency +
    modelConfidence * WEIGHTS.modelConfidence +
    argImpact * WEIGHTS.argImpact +
    responseQuality * WEIGHTS.responseQuality
  );

  const score = Math.max(0, Math.min(100, raw));
  const profile = getFRIProfile(score);

  return {
    score,
    level: profile.level,
    icon: profile.icon,
    color: profile.color,
    description: profile.description,
    breakdown: {
      satisfaction,
      trend,
      volume,
      consistency,
      modelConfidence,
      argImpact,
      responseQuality,
    },
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
