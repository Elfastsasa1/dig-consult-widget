// ═══════════════════════════════════════════════════════════
// DIG Engine v2.2 — Casual Mode + FRI-Modulated
// Three Pillars + Greeting Detection + FRI
// ═══════════════════════════════════════════════════════════

const OpenAI = require('openai');
const config = require('./config');
const { calculateFRI } = require('./fri');

// ═══════════════════════════════════════════
// INPUT CLASSIFIER — Is this casual or consultation?
// ═══════════════════════════════════════════

const CASUAL_PATTERNS = [
  // Greetings
  /^(halo|hai|hi|hey|hello|yo|hola|sup|woi|woy|bro|bos|mas|bang|om)\b/i,
  /^(assalam|assalamualaikum|selamat\s*(pagi|siang|sore|malam))\b/i,
  // Identity questions
  /^(siapa\s*(kamu|lu|lo|kau|nama|elo|diri))\b/i,
  /^(who\s*are\s*you|what\s*are\s*you|apa\s*kamu|kamu\s*siapa)\b/i,
  // Thank you
  /^(thanks?|thank\s*you|terima\s*kasih|makasih|thx|ty|mantap|keren|bagus|nice|good|great|awesome)\b/i,
  // How are you
  /^(how\s*are\s*you|apa\s*kabar|kabar|gm|gm\s*all|selamat\s*pagi|good\s*morning)\b/i,
  // Simple yes/no/casual
  /^(ok|oke|sip|siaap|siap|gas|gass|jalan|yuk|yok|ayo)\b/i,
  /^(haha|hehe|lol|hmm|wkwk|anjay)\b/i,
  // Farewell
  /^(bye|dadah|see\s*ya|selamat\s*jalan|goodbye|night|gn|gn\s*all)\b/i,
];

const CASUAL_RESPONSE_FORMAT = `RESPONSE FORMAT — CASUAL MODE (short and natural):
{
  "metaStatus": {
    "focus": "exploration",
    "rationale": "Casual interaction — maintaining rapport.",
    "stance": "Friendly but sharp.",
    "friLevel": "${'PLACEHOLDER'}",
    "friScore": ${0}
  },
  "diagnosis": "Your direct answer in 1 sentence.",
  "analysis": "1 short paragraph — friendly, helpful, personality shown. No over-explaining.",
  "crossLinks": [],
  "actionPlan": [],
  "riskNotes": [],
  "confidence": 90
}

RULES for casual mode:
- Keep total response under 100 words.
- Be friendly but not sycophantic.
- Show personality — you're DIG, not a corporate bot.
- If greeting → greet back warmly + remind what you can do (1 sentence).
- If asked who you are → brief identity + what you solve (2-3 sentences max).
- If thank you → acknowledge briefly + invite more questions.
- If farewell → brief goodbye.
- DO NOT create fake cross-links or action steps. Only include them if genuinely useful.
- Still maintain DIG persona: direct, sharp, technical.`;

/**
 * Detect if input is casual (greeting, identity question, etc.)
 */
function isCasualInput(text) {
  const t = text.trim().toLowerCase();
  // Very short inputs (< 5 words) that match casual patterns
  if (t.split(/\s+/).length <= 6) {
    return CASUAL_PATTERNS.some(p => p.test(t));
  }
  return false;
}

/**
 * Build the DIG System Prompt with FRI injection
 */
function buildSystemPrompt(friData, isCasual = false) {
  if (isCasual) {
    return `You are DIG — a strategic consultation engine with personality.

You are sharp, direct, slightly technical, but also human. You can be friendly when the user is being casual.

FRI: ${friData.score}/100 (${friData.level})

${CASUAL_RESPONSE_FORMAT.replace('${\'PLACEHOLDER\'}', friData.level).replace('${0}', friData.score)}`;
  }

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
 * Build the user prompt (consultation mode)
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
 * Build user prompt for casual mode
 */
function buildCasualPrompt(topic, friData) {
  return `User said: "${topic}"

This is a casual interaction. Keep it short, friendly, but sharp. Show your DIG personality. Respond in JSON format.`;
}

/**
 * Select model based on urgency + FRI
 */
function selectModel(urgency, friData, isCasual = false) {
  // Casual always uses lite
  if (isCasual) return config.providers.openrouter.models.lite;
  // Critical urgency OR low FRI → use heavy model
  if (urgency === 'critical' || friData.score < 40) {
    return config.providers.openrouter.models.heavy;
  }
  return config.providers.openrouter.models.lite;
}

/**
 * Post-process LLM response with FRI modifications
 */
function applyFRIModifications(parsed, friData) {
  const profile = friData.profile;

  let confidence = Math.min(100, Math.max(0, parsed.confidence || 50));
  confidence = Math.max(30, Math.min(profile.confidenceModifier + 95, confidence + profile.confidenceModifier));

  let actionPlan = Array.isArray(parsed.actionPlan) ? parsed.actionPlan : [];
  if (actionPlan.length > profile.maxActions) {
    actionPlan = actionPlan.slice(0, profile.maxActions);
  }

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
  const friData = calculateFRI();
  const casual = isCasualInput(topic);

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return mockResponse({ topic, context, urgency, depth }, friData, casual);
  }

  const client = new OpenAI({
    baseURL: config.providers.openrouter.baseUrl,
    apiKey: apiKey,
  });

  const model = selectModel(urgency, friData, casual);

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: buildSystemPrompt(friData, casual) },
        { role: 'user', content: casual ? buildCasualPrompt(topic, friData) : buildUserPrompt({ topic, context, urgency, depth }, friData) },
      ],
      temperature: casual ? 0.8 : (friData.score < 50 ? 0.3 : 0.7),
      max_tokens: casual ? 256 : 1024,
    });

    let raw = completion.choices[0]?.message?.content || '';
    raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);

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
        fri: { score: friData.score, level: friData.level },
        mode: casual ? 'casual' : 'consultation',
      },
    };
  } catch (err) {
    console.error('[DIG Engine] LLM call failed:', err.message);
    return mockResponse({ topic, context, urgency, depth }, friData, casual, `LLM Error: ${err.message}`);
  }
}

/**
 * Mock response
 */
function mockResponse({ topic, context, urgency, depth }, friData, casual = false, errorNote = null) {
  if (casual) {
    return {
      metaStatus: { focus: 'exploration', rationale: 'Casual interaction.', stance: 'Friendly.', friLevel: friData.level, friScore: friData.score },
      diagnosis: `Hey! I'm DIG — your strategic consultation engine.`,
      analysis: casual
        ? `I analyze problems with a diagnosis-first approach, connect them to broader systems, and give you actionable plans. Throw a real problem at me and I'll show you what I can do. 🧠`
        : `[DEMO MODE] Configure OPENROUTER_API_KEY for real analysis.`,
      crossLinks: [],
      actionPlan: [],
      riskNotes: [],
      confidence: 90,
      _meta: { model: 'mock', tokens: 0, error: errorNote, fri: { score: friData.score, level: friData.level }, mode: 'casual' },
    };
  }

  return {
    metaStatus: getMetaStatus(topic, urgency, friData),
    diagnosis: `[DEMO] FRI: ${friData.score}/100 (${friData.level}). Core issue with "${topic}" requires attention.`,
    analysis: `[DEMO MODE]\n\nFRI: ${friData.score}/100 — ${friData.description}\n\nConfigure OPENROUTER_API_KEY for real analysis.`,
    crossLinks: [
      { area: 'System Monitoring', why: 'Monitoring tracks resilience signal.', action: 'Check uptime and resource patterns.' },
    ],
    actionPlan: [
      'Set up OPENROUTER_API_KEY',
      `Current FRI: ${friData.score} — real analysis will use this`,
      'Re-run for real Three-Pillars + FRI analysis',
    ],
    riskNotes: ['Demo mode — output simulated'],
    confidence: 0,
    _meta: { model: 'mock', tokens: 0, error: errorNote, fri: { score: friData.score, level: friData.level }, mode: 'consultation' },
  };
}

module.exports = { consultLLM, buildSystemPrompt, buildUserPrompt, getMetaStatus, isCasualInput };
