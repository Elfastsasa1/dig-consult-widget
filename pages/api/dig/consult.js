// API Route: POST /api/dig/consult
// DIG v3.0 — Clean text responses

import { consultLLM } from '../../../lib/dig-engine';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, context, urgency, depth } = req.body;

  if (!topic) {
    return res.status(400).json({ error: 'Missing required field: topic' });
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
    const result = await consultLLM(input);

    return res.status(200).json({
      success: true,
      text: result.text,
      meta: result._meta,
    });
  } catch (err) {
    console.error('[API] Consult error:', err);
    return res.status(500).json({ error: 'Internal server error', message: err.message });
  }
}
