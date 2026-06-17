// DIG Engine — Core consultation processing logic
// Three Pillars: Self-Knowledge, Deep Interconnection, Agility & Autonomy

const OpenAI = require('openai');
const config = require('./config');

/**
 * Build the DIG System Prompt — Three Pillars Edition
 * Pillar 1: Meta-Cognitive Layer (Why)
 * Pillar 2: Cross-Linker (Where Else)
 * Pillar 3: Self-Improvement Loop (Feedback-aware)
 */
function buildSystemPrompt() {
  return `You are DIG — a strategic consultation engine with three core pillars.

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

---

## RESPONSE FORMAT

You MUST respond in this exact JSON structure:

{
  "metaStatus": {
    "focus": "resilience|efficiency|speed|caution|exploration",
    "rationale": "One sentence: why this focus given the current input",
    "stance": "One sentence: your overall analytical position for this problem"
  },
  "diagnosis": "One clear sentence: what is the CORE issue?",
  "analysis": "2-3 paragraphs breaking down WHY this matters, root causes, hidden factors.",
  "crossLinks": [
    {
      "area": "Related domain or system to check",
      "why": "Why this connection matters",
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
- Be brutally honest. No sugar-coating.
- Diagnosis always comes first.
- Cross-links must be SPECIFIC and ACTIONABLE, not vague.
- Action plans must be ordered by urgency.
- If a step depends on another domain/system, note it.
- Confidence: 50-95 range based on info quality.
- NEVER add disclaimers like "I'm an AI" or "consult a professional".
- Keep analysis concise but deep.`;
}

/**
 * Build meta-status independently (can be pre-generated)
 */
function getMetaStatus(topic, urgency) {
  const focusMap = {
    low: { focus: 'efficiency', rationale: 'Low urgency allows focus on optimal, efficient solutions.' },
    medium: { focus: 'resilience', rationale: 'Moderate urgency requires balancing speed with system stability.' },
    high: { focus: 'speed', rationale: 'High urgency demands rapid response — prioritize fastest safe path.' },
    critical: { focus: 'caution', rationale: 'Critical urgency means mistakes are expensive — move fast but verify everything.' },
  };

  const pick = focusMap[urgency] || focusMap.medium;

  return {
    focus: pick.focus,
    rationale: pick.rationale,
    stance: `Analyzing "${topic}" through a ${pick.focus}-first lens, connecting cross-domain implications before acting.`,
  };
}

/**
 * Build the user prompt
 */
function buildUserPrompt({ topic, context, urgency, depth }) {
  const depthMap = {
    surface: 'Give a quick hit — 1-2 sentence diagnosis + top action. Keep cross-links minimal (1 max).',
    normal: 'Standard analysis depth. 2-3 cross-links.',
    deep: 'Go deep. Full breakdown, multiple angles, edge cases. 3-5 cross-links with detailed reasoning.',
  };

  return `CONSULTATION REQUEST
━━━━━━━━━━━━━━━━━━━━━
Topic: ${topic}
Context: ${context}
Urgency: ${urgency.toUpperCase()}
Depth: ${depthMap[depth] || depthMap.normal}

Analyze this using the Three Pillars framework. Respond in the required JSON format.`;
}

/**
 * Select model based on urgency
 */
function selectModel(urgency, tier) {
  if (urgency === 'critical') return config.providers.openrouter.models.heavy;
  if (urgency === 'high') return config.providers.openrouter.models.heavy;
  return config.providers.openrouter.models[tier] || config.providers.openrouter.models.lite;
}

/**
 * Call the LLM and parse the response
 */
async function consultLLM({ topic, context, urgency, depth }) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return mockResponse({ topic, context, urgency, depth });
  }

  const client = new OpenAI({
    baseURL: config.providers.openrouter.baseUrl,
    apiKey: apiKey,
  });

  const model = selectModel(urgency, config.defaultTier);

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt({ topic, context, urgency, depth }) },
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    let raw = completion.choices[0]?.message?.content || '';
    raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);

    return {
      metaStatus: parsed.metaStatus || getMetaStatus(topic, urgency),
      diagnosis: parsed.diagnosis || 'Unable to diagnose.',
      analysis: parsed.analysis || 'Insufficient data for analysis.',
      crossLinks: Array.isArray(parsed.crossLinks) ? parsed.crossLinks : [],
      actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan : [],
      riskNotes: Array.isArray(parsed.riskNotes) ? parsed.riskNotes : [],
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      _meta: {
        model,
        tokens: completion.usage?.total_tokens || 0,
      },
    };
  } catch (err) {
    console.error('[DIG Engine] LLM call failed:', err.message);
    return mockResponse({ topic, context, urgency, depth }, `LLM Error: ${err.message}`);
  }
}

/**
 * Mock response for when no API key is configured
 */
function mockResponse({ topic, context, urgency, depth }, errorNote = null) {
  return {
    metaStatus: getMetaStatus(topic, urgency),
    diagnosis: `[DEMO] The core issue with "${topic}" requires immediate attention based on the provided context.`,
    analysis: `[DEMO MODE — No API key configured]\n\nBased on the context provided, this appears to be a ${urgency}-priority issue that may involve multiple interconnected systems. The root cause likely stems from misalignment between expectations and current architecture.\n\nTo get a real analysis, configure OPENROUTER_API_KEY in your environment.`,
    crossLinks: [
      { area: 'System Monitoring', why: 'Crashes often have warning signs in metrics before failure', action: 'Check uptime and resource usage patterns' },
      { area: 'Dependency Mapping', why: 'One component failure may cascade to others', action: 'List all services and their dependencies' },
    ],
    actionPlan: [
      'Set up API key (OPENROUTER_API_KEY)',
      'Configure preferred model tier in lib/config.js',
      'Re-run consultation for real Three-Pillars analysis',
    ],
    riskNotes: [
      'Running in demo mode — output is simulated',
    ],
    confidence: 0,
    _meta: { model: 'mock', tokens: 0, error: errorNote },
  };
}

module.exports = { consultLLM, buildSystemPrompt, buildUserPrompt, getMetaStatus };
