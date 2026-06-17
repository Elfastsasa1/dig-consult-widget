// Simple in-memory feedback store (Vercel serverless)
// Persists across requests within same instance, resets on cold start
// For production: swap to Supabase / PlanetScale / Vercel KV

const fs = require('fs');
const path = require('path');

const TMP_FILE = '/tmp/dig-feedback.json';

// Load from /tmp on cold start
let feedbackStore = [];
try {
  if (fs.existsSync(TMP_FILE)) {
    feedbackStore = JSON.parse(fs.readFileSync(TMP_FILE, 'utf8'));
  }
} catch (e) {
  feedbackStore = [];
}

function saveToDisk() {
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(feedbackStore, null, 2));
  } catch (e) { /* /tmp might not be writable */ }
}

function addFeedback({ messageIndex, userMessage, diagnosis, rating, comment, timestamp }) {
  const entry = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    messageIndex,
    userMessage: (userMessage || '').substring(0, 500),
    diagnosis: (diagnosis || '').substring(0, 1000),
    rating, // 'up' or 'down'
    comment: (comment || '').substring(0, 1000),
    timestamp: timestamp || new Date().toISOString(),
  };
  feedbackStore.push(entry);
  saveToDisk();
  return entry;
}

function getStats() {
  const total = feedbackStore.length;
  const ups = feedbackStore.filter(f => f.rating === 'up').length;
  const downs = feedbackStore.filter(f => f.rating === 'down').length;

  // Last 24h stats
  const now = Date.now();
  const dayAgo = new Date(now - 86400000).toISOString();
  const recent = feedbackStore.filter(f => f.timestamp > dayAgo);
  const recentUps = recent.filter(f => f.rating === 'up').length;
  const recentDowns = recent.filter(f => f.rating === 'down').length;

  // Negative pattern detection
  const last20 = feedbackStore.slice(-20);
  const last20Downs = last20.filter(f => f.rating === 'down').length;
  const negativeAlert = last20.length >= 10 && (last20Downs / last20.length) > 0.5;

  // Recent negative entries for analysis
  const recentNegatives = feedbackStore
    .filter(f => f.rating === 'down')
    .slice(-10)
    .map(f => ({
      userMessage: f.userMessage,
      diagnosis: f.diagnosis,
      comment: f.comment,
      timestamp: f.timestamp,
    }));

  return {
    total,
    ups,
    downs,
    satisfactionRate: total > 0 ? Math.round((ups / total) * 100) : 0,
    last24h: { total: recent.length, ups: recentUps, downs: recentDowns },
    negativeAlert,
    recentNegatives,
    timestamps: feedbackStore.map(f => f.timestamp),
  };
}

function getAllFeedback(page = 1, limit = 20) {
  const start = (page - 1) * limit;
  const items = feedbackStore.slice().reverse().slice(start, start + limit);
  return {
    items,
    total: feedbackStore.length,
    page,
    totalPages: Math.ceil(feedbackStore.length / limit),
  };
}

module.exports = { addFeedback, getStats, getAllFeedback };
