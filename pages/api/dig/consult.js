// API Route: POST /api/dig/consult
// Three Pillars consultation: Self-Knowledge + Cross-Linker + Feedback Loop
// v2.0: FRI-Modulated Edition

import { consultLLM } from '../../../lib/dig-engine';
import { calculateFRI } from '../../../lib/fri';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, context, urgency, depth } = req.body;

  if (!topic) {
    return res.status(400).json({
      error: 'Missing required field: topic',
      optional: ['context', 'urgency', 'depth'],
    });
  }

  const validUrgency = ['low', 'medium', 'high', 'critical'];
  const validDepth = ['surface', 'normal', 'deep'];

  const input = {
    topic: String(topic).trim().substring(0, 500),
    context: String(context || topic).trim().substring(0, 5000),
    urgency: validUrgency.includes(urgency) ? urgency : 'medium',
    depth: validDepth.includes(depth) ? depth : 'normal',
  };

  try {
    // Calculate FRI for pre-call context
    const friData = calculateFRI();

    const result = await consultLLM(input);

    return res.status(200).json({
      success: true,
      input: { topic: input.topic, urgency: input.urgency, depth: input.depth },
      result: {
        metaStatus: result.metaStatus,
        diagnosis: result.diagnosis,
        analysis: result.analysis,
        crossLinks: result.crossLinks,
        actionPlan: result.actionPlan,
        riskNotes: result.riskNotes,
        confidence: result.confidence,
      },
      fri: {
        score: friData.score,
        level: friData.level,
        icon: friData.icon,
        color: friData.color,
        description: friData.description,
        breakdown: friData.breakdown,
      },
      meta: result._meta,
    });
  } catch (err) {
    console.error('[API] Consult error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
