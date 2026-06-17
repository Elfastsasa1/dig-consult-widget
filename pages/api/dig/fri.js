// GET /api/dig/fri — Real-time FRI data
// This is the heartbeat of the system

import { calculateFRI } from '../../../lib/fri';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const fri = calculateFRI();
    return res.status(200).json({
      success: true,
      fri: {
        score: fri.score,
        level: fri.level,
        icon: fri.icon,
        color: fri.color,
        description: fri.description,
        breakdown: fri.breakdown,
        stats: fri.stats,
      },
    });
  } catch (err) {
    console.error('[API] FRI calculation error:', err);
    return res.status(500).json({ error: 'FRI calculation failed', message: err.message });
  }
}
