// ═══════════════════════════════════════════════════════════
// ARG — Adversarial Response Generator v1.0
// Dedicated adversarial pass: a separate LLM call that
// ATTACKS the primary response's foundations.
//
// This is NOT just a prompt trick — it's a two-model
// adversarial pipeline:
//   Model A answers → Model B attacks the answer
// ═══════════════════════════════════════════════════════════

const OpenAI = require('openai');
const config = require('./config');

// ═══════════════════════════════════════════
// ARG PROMPT — The Adversary
// ═══════════════════════════════════════════

const ARG_SYSTEM_PROMPT = `Kamu adalah ARG (Adversarial Response Generator) — sebuah sistem audit yang TIDAK menjawab pertanyaan, tapi MENYERANG jawaban yang sudah diberikan.

Tugasmu:
1. Temukan KELEMAHAN dalam jawaban: asumsi tak berdasar, generalisasi berlebihan, klaim tanpa bukti, missing perspective, bias tersembunyi.
2. Temukan APA YANG TIDAK DIKATAKAN: perspektif berlawanan, risiko yang diabaikan, informasi kritis yang missing.
3. Temukan TRIBAL KNOWLEDGE BIAS: kecenderungan jawaban untuk hanya mengulang what's "safe" atau "popular" bukan what's accurate.
4. Berikan COUNTER-POINTS konkret — bukan sekadar "ada sisi lain" tapi SPESIFIK apa sisi lainnya.

Format output:
- Tulis dalam Bahasa Indonesia, campur Inggris jika istilah teknis lebih pas.
- TULIS LANGSUNG sebagai tambahan/revisi, BUKAN sebagai laporan terpisah.
- Output berupa: "counter_points: ..." (max 3 poin terkuat).
- Kalau jawaban sudah solid dan tidak ada kelemahan signifikan, cukup tulis: "counter_points: SOLID"
- JANGAN pakai section headers, labels, confidence scores, atau metadata.
- Max 150 kata. Langsung ke inti.`;

// ═══════════════════════════════════════════
// ARG PROCESSOR — Attack the Response
// ═══════════════════════════════════════════

async function processARG(query, response, friData, apiKey) {
  if (!apiKey) return { counterPoints: null, impact: 'none', attacked: false };

  const client = new OpenAI({
    baseURL: config.providers.openrouter.baseUrl,
    apiKey,
  });

  // Determine ARG aggressiveness based on FRI
  const aggressiveness = friData.score < 40 ? 'MEDIUM' :
                         friData.score > 70 ? 'HIGH' : 'MEDIUM';

  const userPrompt = `ARG Aggressiveness: ${aggressiveness}

Original Query:
"${query}"

Response to Attack:
"${response}"

Serang jawaban ini. Temukan kelemahan, bias, dan apa yang tidak dikatakan.`;

  try {
    const completion = await client.chat.completions.create({
      model: config.providers.openrouter.models.lite, // ARG always uses fast model
      messages: [
        { role: 'system', content: ARG_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const raw = completion.choices[0]?.message?.content || '';
    const counterPoints = extractCounterPoints(raw);

    if (!counterPoints || counterPoints === 'SOLID') {
      return { counterPoints: null, impact: 'none', attacked: true };
    }

    // Determine impact level
    const impact = calculateARGImpact(counterPoints, friData);

    return { counterPoints, impact, attacked: true };
  } catch (err) {
    console.error('[ARG v1] LLM call failed:', err.message);
    return { counterPoints: null, impact: 'none', attacked: false };
  }
}

// ═══════════════════════════════════════════
// COUNTER-POINT EXTRACTION
// ═══════════════════════════════════════════

function extractCounterPoints(raw) {
  let text = raw.trim();

  // Strip code fences
  text = text.replace(/^```(?:text)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  // Extract after "counter_points:" if present
  const match = text.match(/counter[_\s]?points?\s*:\s*(.*)/is);
  if (match) {
    text = match[1].trim();
  }

  // If SOLID or very short, return null
  if (/^(solid|none|tidak ada|ok|good|bagus)$/i.test(text) || text.length < 15) {
    return null;
  }

  return text;
}

// ═══════════════════════════════════════════
// ARG IMPACT SCORING
// How much should ARG influence the final output
// ═══════════════════════════════════════════

function calculateARGImpact(counterPoints, friData) {
  // Base impact from counter point strength
  const length = counterPoints.length;
  const hasSpecific = /\d|contoh|kasus|studi|research|data/i.test(counterPoints);

  let baseImpact = 0;
  if (hasSpecific) baseImpact += 2;
  if (length > 100) baseImpact += 1;
  if (length > 200) baseImpact += 1;

  // FRI modulates: low FRI = more weight to ARG
  const friModifier = friData.score < 40 ? 2 : friData.score > 70 ? 0 : 1;

  const total = baseImpact + friModifier;

  if (total >= 4) return 'high';
  if (total >= 2) return 'medium';
  return 'low';
}

// ═══════════════════════════════════════════
// INTEGRATION HELPER
// Append ARG findings to response text
// ═══════════════════════════════════════════

function appendARGToResponse(text, argResult) {
  if (!argResult.attacked || !argResult.counterPoints) return text;

  const separator = text.endsWith('.') ? '' : '.';

  switch (argResult.impact) {
    case 'high':
      // High impact: prepend as warning, then append counter-points
      return `${text}\n\nPerlu dikoreksi: ${argResult.counterPoints}`;
    case 'medium':
      // Medium: append naturally
      return `${text}${separator} Tapi perlu diingat: ${argResult.counterPoints}`;
    default:
      // Low: subtle note
      return `${text}${separator} Catatan tambahan: ${argResult.counterPoints}`;
  }
}

// ═══════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════

module.exports = { processARG, appendARGToResponse };
