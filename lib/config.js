// API Configuration — DIG v2.0 FRI-Modulated
module.exports = {
  // Supported AI providers
  providers: {
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1',
      envKey: 'OPENROUTER_API_KEY',
      models: {
        lite: 'google/gemini-2.5-flash',
        heavy: 'anthropic/claude-sonnet-4',
      },
    },
  },

  // Default model tier
  defaultTier: 'lite',

  // DIG Consultation Schema
  schema: {
    input: {
      topic: 'string',        // Required: what the consultation is about
      context: 'string',      // Required: background info
      urgency: 'enum',        // Required: low | medium | high | critical
      depth: 'enum',          // Optional: surface | normal | deep
    },
    output: {
      metaStatus: 'object',   // Meta-cognitive status + FRI level
      diagnosis: 'string',    // What's the core issue
      analysis: 'string',     // Why it matters + breakdown
      crossLinks: 'array',    // Related domain connections
      actionPlan: 'array',    // Ordered steps to take
      riskNotes: 'array',     // What could go wrong
      confidence: 'number',   // 0-100 how confident the analysis is
    },
  },
};
