// Debug: check if env vars are accessible in serverless
export default function handler(req, res) {
  const key = process.env.OPENROUTER_API_KEY;
  res.status(200).json({
    hasKey: !!key,
    keyLength: key ? key.length : 0,
    keyPrefix: key ? key.substring(0, 8) + '...' : 'none',
  });
}
