// API Route: POST /api/dig/consult
// Handles consultation requests from the DIG Widget

import { consultLLM } from '../../../lib/dig-engine';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { topic, context, urgency, depth } = req.body;

  // Validation
  if (!topic || !context) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['topic', 'context'],
      optional: ['urgency (default: medium)', 'depth (default: normal)'],
    });
  }

  const validUrgency = ['low', 'medium', 'high', 'critical'];
  const validDepth = ['surface', 'normal', 'deep'];

  const input = {
    topic: String(topic).trim().substring(0, 500),
    context: String(context).trim().substring(0, 5000),
    urgency: validUrgency.includes(urgency) ? urgency : 'medium',
    depth: validDepth.includes(depth) ? depth : 'normal',
  };

  try {
    const result = await consultLLM(input);

    return res.status(200).json({
      success: true,
      input: {
        topic: input.topic,
        urgency: input.urgency,
        depth: input.depth,
      },
      result: {
        diagnosis: result.diagnosis,
        analysis: result.analysis,
        actionPlan: result.actionPlan,
        riskNotes: result.riskNotes,
        confidence: result.confidence,
      },
      meta: result._meta,
    });
  } catch (err) {
    console.error('[API] Consult error:', err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message,
    });
  }
}
