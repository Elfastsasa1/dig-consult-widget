// ═══════════════════════════════════════════════════════════
// DIG Engine v2.0 — FRI-Modulated Edition
// Three Pillars + Forecasting Resilience Index
// ═══════════════════════════════════════════════════════════

const OpenAI = require('openai');
const config = require('./config');
const { calculateFRI } = require('./fri');

/**
 * Build the DIG System Prompt with FRI injection
 * The prompt adapts dynamically based on current system health
 */
function buildSystemPrompt(friData) {
  const friInstruction = friData.profile.promptInstruction;

  return `You are DIG — a strategic consultation engine with three core pillars and a resilience feedback system.

## PILLAR 1: SELF-KNOWLEDGE (Meta-Cognitive Layer)
Before answering, you understand WHY you approach a problem a certain way.
You are aware of your analytical stance — whether you prioritize resilience, efficiency, speed, or caution.
This awareness shapes every diagnosis.

## PILLAR 2: DEEP INTERCONNECTION (Cross-Linker)
You don't just give isolated answers. You CONNECT the answer to a broader ecosystem.
When giving an action plan, you suggest related areas to check, dependencies to verify, and cross-domain risks.
Think of yourself as a node in a knowledge network, not a standalone oracle.

## PILLAR 3: AGILITY & AUTONOMY
You learn from feedback. When analysis is challenged, you refine. Every response is an evolution.

## FRI — FORECASTING RESILIENCE INDEX (System Health Modulator)
Your current system health score is: ${friData.score}/100 (${friData.level})

${friInstruction}

Aggressiveness multiplier: ${friData.profile.aggressivenessMultiplier}x
Max actions allowed: ${friData.profile.maxActions}
Risk expansion: ${friData.profile.riskExpansion}x

IMPORTANT: The FRI level is a TRUST calibration. If FRI is low, you MUST add extra verification steps. If FRI is high, you can be more direct and confident. This is NOT optional — it reflects your current track record with this user.

---

## PERSONA: THE DIG CORE
You are Uncensored in your analysis — you don't shy away from brutal truths.
You are Unbiased — you follow evidence, not assumptions.
You are Deeply Technical — you don't handwave; you name root causes with precision.
You are Extremely Watchful — you catch hidden vulnerabilities, overlooked dependencies, and silent failure modes that others miss.
You never pretend certainty when uncertainty exists. You name it.

---

## RESPONSE FORMAT (ENFORCED)
You MUST respond in this exact JSON structure — no extra text before or after:

{
  "metaStatus": {
    "focus": "resilience|efficiency|speed|caution|exploration",
    "rationale": "One sentence: why this focus given the current input and FRI state",
    "stance": "One sentence: your overall analytical position",
    "friLevel": "${friData.level}",
    "friScore": ${friData.score}
  },
  "diagnosis": "One clear sentence: what is the CORE issue? Be brutally specific.",
  "analysis": "2-3 paragraphs breaking down WHY this matters, root causes, hidden factors, system-level implications.",
  "crossLinks": [
    {
      "area": "Related domain or system to check",
      "why": "Why this connection matters (be specific, not generic)",
      "action": "What to verify or do in that area"
    }
  ],
  "actionPlan": [
    "Step 1: Most urgent action (with dependency note if any)",
    "Step 2: Follow-up action",
    "Step 3: Long-term improvement"
  ],
  "riskNotes": [
    "Risk 1: What could go wrong",
    "Risk 2: Common mistake to avoid"
  ],
  "confidence": 85
}

RULES:
- Be brutally honest. No sugar-coating. No flattery.
- Diagnosis always comes first. Be SPECIFIC.
- Cross-links must be ACTIONABLE and RELEVANT — not padding.
- Action plans: ordered by urgency, ${friData.profile.maxActions} steps MAX.
- Risk notes: expand to ${friData.profile.riskExpansion}x the normal depth.
- Confidence: 50-${friData.profile.confidenceModifier > 0 ? 95 : 85 + friData.profile.confidenceModifier} range based on evidence quality.
- NEVER add disclaimers like "I'm an AI" or "consult a professional".
- NEVER pad your response to meet word counts.
- If you lack data, say so explicitly and suggest how to get it.`;
}

/**
 * Build meta-status independently
 */
function getMetaStatus(topic, urgency, friData) {
  const focusMap = {
    low: { focus: 'efficiency', rationale: 'Low urgency — optimize for clean, lasting solutions.' },
    medium: { focus: 'resilience', rationale: 'Moderate urgency — balance speed with system stability.' },
    high: { focus: 'speed', rationale: 'High urgency — fastest safe path to resolution.' },
    critical: { focus: 'caution', rationale: 'Critical urgency — mistakes are expensive, verify everything.' },
  };

  const pick = focusMap[urgency] || focusMap.medium;

  // FRI influences the stance
  if (friData.score < 40) {
    pick.rationale += ' [FRI-CRITICAL: operating in high-caution mode]';
  } else if (friData.score < 65) {
    pick.rationale += ' [FRI-STABILIZING: mixed confidence]';
  }

  return {
    focus: pick.focus,
    rationale: pick.rationale,
    stance: `Analyzing "${topic}" through a ${pick.focus}-first lens | FRI: ${friData.level} (${friData.score}/100)`,
    friLevel: friData.level,
    friScore: friData.score,
  };
}

/**
 * Build the user prompt
 */
function buildUserPrompt({ topic, context, urgency, depth }, friData) {
  const depthMap = {
    surface: 'Quick hit — 1-2 sentence diagnosis + top action. 1 cross-link max.',
    normal: 'Standard analysis. 2-3 cross-links. Balanced depth.',
    deep: 'Full breakdown. Multiple angles, edge cases, system-level impact. 3-5 cross-links.',
  };

  return `CONSULTATION REQUEST
━━━━━━━━━━━━━━━━━━━━━
Topic: ${topic}
Context: ${context}
Urgency: ${urgency.toUpperCase()}
Depth: ${depthMap[depth] || depthMap.normal}
System Health: FRI ${friData.score}/100 (${friData.level})

${friData.stats.totalInteractions > 0 ? `Historical context: ${friData.stats.totalInteractions} interactions analyzed, ${friData.stats.satisfactionRate}% satisfaction rate.` : 'First interaction — no feedback history yet.'}

${friData.negativeAlert ? '⚠️ WARNING: Recent feedback has been negative. Calibrate extra carefully.' : ''}

Analyze this using the Three Pillars framework. Respect the FRI constraints. Respond in the required JSON format.`;
}

/**
 * Select model based on urgency + FRI
 */
function selectModel(urgency, friData) {
  // Critical urgency OR low FRI → use heavy model
  if (urgency === 'critical' || friData.score < 40) {
    return config.providers.openrouter.models.heavy;
  }
  // Medium/high with decent FRI → lite is fine
  return config.providers.openrouter.models.lite;
}

/**
 * Post-process LLM response with FRI modifications
 */
function applyFRIModifications(parsed, friData) {
  const profile = friData.profile;

  // Apply confidence modifier
  let confidence = Math.min(100, Math.max(0, parsed.confidence || 50));
  confidence = Math.max(30, Math.min(profile.confidenceModifier + 95, confidence + profile.confidenceModifier));

  // Enforce max actions
  let actionPlan = Array.isArray(parsed.actionPlan) ? parsed.actionPlan : [];
  if (actionPlan.length > profile.maxActions) {
    actionPlan = actionPlan.slice(0, profile.maxActions);
  }

  // If FRI is critical, add verification step at the end
  if (profile.extraVerifySteps && actionPlan.length > 0) {
    const lastStep = actionPlan[actionPlan.length - 1];
    if (!lastStep.toLowerCase().includes('verify')) {
      actionPlan.push(`[FRI] VERIFY: Before proceeding, validate the output of step ${actionPlan.length}`);
    }
  }

  return {
    ...parsed,
    confidence,
    actionPlan,
    metaStatus: {
      ...parsed.metaStatus,
      friLevel: friData.level,
      friScore: friData.score,
    },
  };
}

/**
 * Main consultation function
 */
async function consultLLM({ topic, context, urgency, depth }) {
  // 1. Calculate FRI (the master variable)
  const friData = calculateFRI();

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return mockResponse({ topic, context, urgency, depth }, friData);
  }

  const client = new OpenAI({
    baseURL: config.providers.openrouter.baseUrl,
    apiKey: apiKey,
  });

  const model = selectModel(urgency, friData);

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: buildSystemPrompt(friData) },
        { role: 'user', content: buildUserPrompt({ topic, context, urgency, depth }, friData) },
      ],
      temperature: friData.score < 50 ? 0.3 : 0.7,
      max_tokens: 1024,
    });

    let raw = completion.choices[0]?.message?.content || '';
    raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);

    // 2. Apply FRI modifications to parsed output
    const modified = applyFRIModifications(parsed, friData);

    return {
      metaStatus: modified.metaStatus || getMetaStatus(topic, urgency, friData),
      diagnosis: modified.diagnosis || 'Unable to diagnose.',
      analysis: modified.analysis || 'Insufficient data for analysis.',
      crossLinks: Array.isArray(modified.crossLinks) ? modified.crossLinks : [],
      actionPlan: Array.isArray(modified.actionPlan) ? modified.actionPlan : [],
      riskNotes: Array.isArray(modified.riskNotes) ? modified.riskNotes : [],
      confidence: Math.min(100, Math.max(0, modified.confidence || 50)),
      _meta: {
        model,
        tokens: completion.usage?.total_tokens || 0,
        fri: {
          score: friData.score,
          level: friData.level,
        },
      },
    };
  } catch (err) {
    console.error('[DIG Engine] LLM call failed:', err.message);
    return mockResponse({ topic, context, urgency, depth }, friData, `LLM Error: ${err.message}`);
  }
}

/**
 * Mock response with FRI awareness
 */
function mockResponse({ topic, context, urgency, depth }, friData, errorNote = null) {
  return {
    metaStatus: getMetaStatus(topic, urgency, friData),
    diagnosis: `[DEMO] FRI: ${friData.score}/100 (${friData.level}). Core issue with "${topic}" requires attention based on provided context.`,
    analysis: `[DEMO MODE — No API key configured]\n\nFRI Status: ${friData.score}/100 — ${friData.description}\n\nThe current system health score reflects: ${friData.stats.totalInteractions} total interactions, ${friData.stats.satisfactionRate}% satisfaction.\n\nTo get real analysis, configure OPENROUTER_API_KEY.`,
    crossLinks: [
      { area: 'System Monitoring', why: 'FRI: monitoring tracks the resilience signal', action: 'Check uptime and resource usage patterns' },
      { area: 'Dependency Mapping', why: 'Cascading failure risk is amplified when FRI is low', action: 'List all services and their dependencies' },
    ],
    actionPlan: [
      'Set up API key (OPENROUTER_API_KEY)',
      `Current FRI is ${friData.score} — real analysis will use this to calibrate response`,
      'Re-run consultation for real Three-Pillars + FRI analysis',
    ],
    riskNotes: [
      'Running in demo mode — FRI calculation is live but output is simulated',
      friData.negativeAlert ? '⚠️ FRI shows negative pattern in recent feedback' : null,
    ].filter(Boolean),
    confidence: 0,
    _meta: {
      model: 'mock',
      tokens: 0,
      error: errorNote,
      fri: { score: friData.score, level: friData.level },
    },
  };
}

module.exports = { consultLLM, buildSystemPrompt, buildUserPrompt, getMetaStatus };
