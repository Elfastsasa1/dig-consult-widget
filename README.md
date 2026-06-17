# DIG Consultation Widget

AI Consultation Widget dengan arsitektur "DIG Style" — Diagnosis-First Analysis Engine.

Deploy-ready untuk Vercel + Next.js.

## Struktur

```
dig-consult-widget/
├── pages/
│   ├── index.js                    # Frontend widget (React)
│   └── api/
│       └── dig/
│           └── consult.js          # API route handler
├── lib/
│   ├── config.js                   # Konfigurasi schema + provider
│   └── dig-engine.js               # Core LLM integration engine
├── package.json
├── next.config.js
├── .env.local                      # API keys (jangan di-commit)
└── README.md
```

## Setup

```bash
npm install

# Buat .env.local
cp .env.example .env.local

# Isi API key (OpenRouter — bisa pakai Gemini Flash gratis / Claude)
# OPENROUTER_API_KEY=sk-or-...

npm run dev
```

Buka http://localhost:3000

## Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars di Vercel dashboard
# OPENROUTER_API_KEY=sk-or-...
```

## API

### POST /api/dig/consult

**Request Body:**
```json
{
  "topic": "string (required, max 500 chars)",
  "context": "string (required, max 5000 chars)",
  "urgency": "low | medium | high | critical (default: medium)",
  "depth": "surface | normal | deep (default: normal)"
}
```

**Response:**
```json
{
  "success": true,
  "input": { "topic": "...", "urgency": "medium", "depth": "normal" },
  "result": {
    "diagnosis": "Core issue statement",
    "analysis": "Detailed breakdown",
    "actionPlan": ["Step 1", "Step 2", "Step 3"],
    "riskNotes": ["Risk 1", "Risk 2"],
    "confidence": 85
  },
  "meta": { "model": "google/gemini-2.0-flash-001", "tokens": 234 }
}
```

## Model Tiers

| Urgency | Model | Cost |
|---------|-------|------|
| low/medium | Gemini 2.0 Flash | ~$0 (free tier) |
| high/critical | Claude Sonnet | ~$3/M tokens |

## Demo Mode

Tanpa API key, widget jalan dalam mode demo dengan mock response.
Untuk analisis real, isi OPENROUTER_API_KEY.

## Stack

- Next.js 14 (Pages Router)
- OpenAI SDK (OpenRouter compatible)
- React 18
- Vercel Deployment
