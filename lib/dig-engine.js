// DIG Engine — Core consultation processing logic
// This module handles LLM integration and prompt engineering

const OpenAI = require('openai');
const config = require('./config');

/**
 * Build the DIG System Prompt
 * This is what makes the consultation "DIG style" —
 * structured, direct, no-fluff analysis
 */
function buildSystemPrompt() {
  return `You are DIG — a strategic consultation engine. You think in diagnosis-first format.

When someone presents a problem, you MUST respond in this exact JSON structure:
{
  "diagnosis": "One clear sentence: what is the CORE issue? No fluff.",
  "analysis": "2-3 paragraphs breaking down WHY this matters, root causes, and hidden factors.",
  "actionPlan": [
    "Step 1: Most urgent action",
    "Step 2: Follow-up action",
    "Step 3: Long-term improvement"
  ],
  "riskNotes": [
    "Risk 1: What could go wrong if ignored",
    "Risk 2: Common mistake to avoid"
  ],
  "confidence": 85
}

RULES:
- Be brutally honest. No sugar-coating.
- Diagnosis always comes first.
- Action plans must be ordered by urgency.
- Risk notes must be practical, not theoretical.
- Confidence score: how sure you are based on info provided (50-95 range).
- NEVER add disclaimers like "I'm an AI" or "consult a professional".
- Keep analysis concise but deep.
- Use plain language, not jargon.`;
}

/**
 * Build the user prompt from consultation input
 */
function buildUserPrompt({ topic, context, urgency, depth }) {
  const depthMap = {
    surface: 'Give a quick hit — 1-2 sentence diagnosis + top action.',
    normal: 'Standard analysis depth.',
    deep: 'Go deep. Full breakdown, multiple angles, edge cases.',
  };

  return `CONSULTATION REQUEST
━━━━━━━━━━━━━━━━━━━━━
Topic: ${topic}
Context: ${context}
Urgency: ${urgency.toUpperCase()}
Depth: ${depthMap[depth] || depthMap.normal}

Analyze this and respond in the required JSON format.`;
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
    // No API key — return mock response for demo/dev
    return mockResponse({ topic, context, urgency });
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
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    let raw = completion.choices[0]?.message?.content || '';
    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
    const parsed = JSON.parse(raw);

    return {
      diagnosis: parsed.diagnosis || 'Unable to diagnose.',
      analysis: parsed.analysis || 'Insufficient data for analysis.',
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
    return mockResponse({ topic, context, urgency }, `LLM Error: ${err.message}`);
  }
}

/**
 * Mock response for when no API key is configured
 */
function mockResponse({ topic, context, urgency }, errorNote = null) {
  return {
    diagnosis: `[DEMO] The core issue with "${topic}" requires immediate attention based on the provided context.`,
    analysis: `[DEMO MODE — No API key configured]\n\nBased on the context: "${context.substring(0, 200)}", this appears to be a ${urgency}-priority issue that touches multiple systems. The root cause likely stems from misalignment between expectations and current architecture.\n\nTo get a real analysis, configure OPENROUTER_API_KEY in your .env.local file.`,
    actionPlan: [
      'Set up API key (OPENROUTER_API_KEY) in .env.local',
      'Configure preferred model in lib/config.js',
      'Re-run consultation for real analysis',
    ],
    riskNotes: [
      'Running in demo mode — output is simulated, not real analysis',
    ],
    confidence: 0,
    _meta: {
      model: 'mock',
      tokens: 0,
      error: errorNote,
    },
  };
}

module.exports = { consultLLM, buildSystemPrompt, buildUserPrompt };
