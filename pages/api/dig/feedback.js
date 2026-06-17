// POST /api/dig/feedback — Submit feedback (thumbs up/down)
// GET /api/dig/feedback — Get feedback stats + list

import { addFeedback, getStats, getAllFeedback } from '../../../lib/feedback-store';

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET — stats + list
  if (req.method === 'GET') {
    const stats = getStats();
    const page = parseInt(req.query.page) || 1;
    const list = getAllFeedback(page, 20);
    return res.status(200).json({ stats, list });
  }

  // POST — submit feedback
  if (req.method === 'POST') {
    const { messageIndex, userMessage, diagnosis, rating, comment } = req.body;

    if (!rating || !['up', 'down'].includes(rating)) {
      return res.status(400).json({ error: 'rating must be "up" or "down"' });
    }

    const entry = addFeedback({ messageIndex, userMessage, diagnosis, rating, comment });

    // Check for negative alert
    const stats = getStats();

    return res.status(200).json({
      success: true,
      entry,
      alert: stats.negativeAlert ? {
        type: 'negative_pattern',
        message: 'High negative feedback rate detected in recent 20 interactions',
        downs_last20: stats.recentNegatives.length,
      } : null,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
