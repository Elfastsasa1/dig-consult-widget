// ═══════════════════════════════════════════════════════════
// CROSS-LINKER v1.0 — Knowledge Graph + Entity Extraction
// The "Where Else" Engine
//
// Setiap query diekstrak entitasnya, dihubungkan ke domain
// knowledge, dan menghasilkan forced-divergence links.
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════
// ENTITY EXTRACTION (rule-based, zero API cost)
// ═══════════════════════════════════════════

const ENTITY_RULES = [
  // Domain labels
  { pattern: /\b(crypto|bitcoin|btc|ethereum|eth|solana|sol|defi|nft|web3|blockchain|token|staking|yield|amm|dex|cefi|altcoin)\b/gi, domain: 'crypto' },
  { pattern: /\b(trading|forex|xauusd|gold|index|saham|stock|futures|options|cfd|scalping|swing|position|leverage|margin|lot|pip|spread|indicator|rsi|macd|bollinger|atr|ema|sma)\b/gi, domain: 'trading' },
  { pattern: /\b(hack|hacking|exploit|vulnerability|cve|penetration|pentest|osint|recon|reconnaissance|social.?engineer|phishing|malware|ransomware|ddos|injection|xss|ssrf|burp|nmap|metasploit)\b/gi, domain: 'security' },
  { pattern: /\b(python|javascript|node\.?js|react|nextjs|next\.?js|html|css|api|rest|graphql|database|sql|mongo|redis|docker|kubernetes|k8s|aws|gcp|azure|vercel|netlify)\b/gi, domain: 'tech' },
  { pattern: /\b(politik|politik|pemerintah|korupsi|otokrasi|demokrasi|ekonomi|inflasi|gdp|suku.?bunga|moneter|fiskal|geopolitik|sanksi)\b/gi, domain: 'geopolitics' },
  { pattern: /\b(psikologi|cognitive|bias|heuristic|mental.?model|decision|kognitif|emosi|fear|greed|fomo|panic|overconfid)\b/gi, domain: 'psychology' },
  { pattern: /\b(bisnis|startup|founder|revenue|profit|market.?fit|growth|hustle|entrepreneur|industri|kompetisi|moat|scaling)\b/gi, domain: 'business' },
  { pattern: /\b(ai|artificial.?intelligence|llm|gpt|gemini|claude|prompt|fine.?tun|training|inference|neural|deep.?learn|machine.?learn|transformer|agent|rag)\b/gi, domain: 'ai' },
  { pattern: /\b(otomatisasi|automation|bot|script|cron|workflow|pipeline|ci.?cd|webhook|scraping)\b/gi, domain: 'automation' },
  { pattern: /\b(hukum|legal|regulasi|compliance|pajak|tax|kontrak|contract|nda|ip|hak.?cipta|paten)\b/gi, domain: 'legal' },
];

// ═══════════════════════════════════════════
// KNOWLEDGE GRAPH — Inter-domain connections
// ═══════════════════════════════════════════

const CROSS_DOMAIN_MAP = {
  crypto: {
    connectsTo: ['security', 'trading', 'tech', 'geopolitics', 'psychology', 'business'],
    hotLinks: [
      'smart contract attack vectors ↔ security exploits',
      'token economics ↔ business model viability',
      'regulatory crackdown ↔ geopolitics impact',
      'wallet security ↔ phishing/social engineering',
      'DeFi yield ↔ risk/reward psychology',
      'MEV/front-running ↔ market microstructure',
    ],
    blindSpots: [
      'Centralization risk in "decentralized" protocols',
      'Regulatory arbitrage fragility',
      'Tokenomics that only work in bull markets',
      'Narrative-driven vs fundamentals-driven pricing',
    ],
  },
  trading: {
    connectsTo: ['psychology', 'ai', 'business', 'geopolitics', 'security'],
    hotLinks: [
      'market microstructure ↔ order flow psychology',
      'technical indicators ↔ cognitive bias in pattern recognition',
      'macro events ↔ geopolitics-driven volatility',
      'algorithmic trading ↔ AI/ML edge degradation',
      'risk management ↔ business capital preservation',
      'broker selection ↔ counterparty/security risk',
    ],
    blindSpots: [
      'Overfitting backtests to historical noise',
      'Survivorship bias in trader communities',
      'Indicator lag disguised as "leading signal"',
      'Correlation ≠ causation in macro narratives',
    ],
  },
  security: {
    connectsTo: ['crypto', 'tech', 'psychology', 'geopolitics', 'business'],
    hotLinks: [
      'OSINT ↔ social engineering attack surface',
      'zero-day ↔ supply chain vulnerability',
      'cryptographic weakness ↔ crypto wallet compromise',
      'human factor ↔ phishing effectiveness',
      'regulatory compliance ↔ security audit requirements',
    ],
    blindSpots: [
      'Security theater vs actual protection',
      'Over-reliance on tools vs methodology',
      'Insider threat underestimated',
    ],
  },
  ai: {
    connectsTo: ['tech', 'business', 'security', 'psychology', 'trading'],
    hotLinks: [
      'prompt injection ↔ security vulnerability',
      'LLM hallucination ↔ decision-making risk',
      'AI in trading ↔ alpha decay from model crowding',
      'fine-tuning bias ↔ tribal knowledge embedding',
      'AI automation ↔ job displacement ↔ business strategy',
    ],
    blindSpots: [
      'AI confidence ≠ actual accuracy',
      'Training data bias propagated as "insight"',
      'Over-reliance on AI for critical decisions',
    ],
  },
  geopolitics: {
    connectsTo: ['crypto', 'trading', 'business', 'legal'],
    hotLinks: [
      'sanctions ↔ crypto evasion attempts',
      'interest rate policy ↔ risk asset correlation',
      'trade wars ↔ supply chain disruption',
      'regulatory capture ↔ industry influence',
    ],
    blindSpots: [
      'Media narrative vs actual policy driver',
      'Short-term noise vs long-term structural shift',
    ],
  },
  psychology: {
    connectsTo: ['trading', 'business', 'ai', 'security', 'crypto'],
    hotLinks: [
      'confirmation bias ↔ selective information processing',
      'Dunning-Kruger ↔ overconfidence in trading',
      'loss aversion ↔ holding losing positions',
      'social proof ↔ herd behavior in markets',
      'anchoring ↔ price expectation distortion',
    ],
    blindSpots: [
      'Awareness of bias ≠ immunity to bias',
      'Emotional state affects analytical quality',
    ],
  },
  business: {
    connectsTo: ['ai', 'crypto', 'psychology', 'legal', 'geopolitics'],
    hotLinks: [
      'market fit ↔ customer psychology',
      'scaling ↔ operational risk',
      'revenue model ↔ regulatory exposure',
      'competition ↔ moat analysis',
    ],
    blindSpots: [
      'Revenue ≠ profit',
      'Growth at all costs vs sustainable unit economics',
    ],
  },
  automation: {
    connectsTo: ['tech', 'ai', 'business', 'security'],
    hotLinks: [
      'bot reliability ↔ monitoring/observability',
      'API dependency ↔ single point of failure',
      'automation ↔ security if credentials leaked',
      'cost optimization ↔ infrastructure scaling',
    ],
    blindSpots: [
      'Automation of broken processes = broken at scale',
      'Over-automation reduces human judgment',
    ],
  },
  legal: {
    connectsTo: ['business', 'crypto', 'geopolitics', 'security'],
    hotLinks: [
      'compliance cost ↔ business viability',
      'crypto regulation ↔ industry uncertainty',
      'data privacy ↔ security requirements',
      'contract risk ↔ counterparty exposure',
    ],
    blindSpots: [
      'Legal ≠ ethical',
      'Jurisdiction arbitrage fragility',
    ],
  },
};

// ═══════════════════════════════════════════
// KEYWORD-LEVEL ENTITY EXTRACTION
// ═══════════════════════════════════════════

function extractEntities(query) {
  const q = query.toLowerCase();
  const entities = [];

  for (const rule of ENTITY_RULES) {
    const matches = q.match(rule.pattern);
    if (matches) {
      // Deduplicate matches
      const unique = [...new Set(matches.map(m => m.toLowerCase()))];
      entities.push({
        domain: rule.domain,
        keywords: unique,
        weight: unique.length, // more matches = stronger domain signal
      });
    }
  }

  // Sort by weight (strongest domain first)
  entities.sort((a, b) => b.weight - a.weight);

  return entities;
}

// ═══════════════════════════════════════════
// CROSS-LINK GENERATOR
// Given entities, produce forced-divergence links
// ═══════════════════════════════════════════

function generateCrossLinks(entities, maxLinks = 5) {
  if (entities.length === 0) return [];

  const links = [];
  const primaryDomain = entities[0].domain;
  const graphData = CROSS_DOMAIN_MAP[primaryDomain];

  if (!graphData) return [];

  // 1. Hot links from primary domain
  for (const link of graphData.hotLinks) {
    if (links.length >= maxLinks) break;
    links.push({ type: 'hot', text: link, source: primaryDomain });
  }

  // 2. If multi-domain query, add cross-connection
  if (entities.length > 1) {
    const secondaryDomain = entities[1].domain;
    const secondaryGraph = CROSS_DOMAIN_MAP[secondaryDomain];

    if (secondaryGraph) {
      // Find shared connections
      const shared = graphData.connectsTo.filter(d =>
        secondaryGraph.connectsTo.includes(d) || d === secondaryDomain
      );

      for (const conn of shared) {
        if (links.length >= maxLinks) break;
        links.push({
          type: 'cross',
          text: `${primaryDomain} ↔ ${secondaryDomain} via ${conn}`,
          source: 'multi-domain',
        });
      }
    }
  }

  // 3. Add blind spots from primary domain
  for (const spot of graphData.blindSpots) {
    if (links.length >= maxLinks) break;
    links.push({ type: 'blindspot', text: spot, source: primaryDomain });
  }

  return links;
}

// ═══════════════════════════════════════════
// BUILD CROSS-LINK CONTEXT FOR LLM PROMPT
// ═══════════════════════════════════════════

function buildCrossLinkContext(query) {
  const entities = extractEntities(query);
  const crossLinks = generateCrossLinks(entities);

  if (crossLinks.length === 0) {
    return { entities: [], crossLinks: [], promptFragment: '' };
  }

  const domains = entities.map(e => e.domain);
  const linksText = crossLinks
    .map(l => {
      const prefix = l.type === 'blindspot' ? '⚠ BLIND SPOT' :
                     l.type === 'cross' ? '🔗 CROSS' : '→';
      return `  ${prefix} ${l.text}`;
    })
    .join('\n');

  const promptFragment = `\n═══ CROSS-LINKER (Where Else) ═══
Detected domains: ${domains.join(', ')}
Forced Divergence:
${linksText}

WAJIB: Hubungkan jawabanmu ke minimal 1 link di atas. Jangan jawab dalam ruang hampa.`;

  return { entities, crossLinks, promptFragment };
}

// ═══════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════

module.exports = {
  extractEntities,
  generateCrossLinks,
  buildCrossLinkContext,
  CROSS_DOMAIN_MAP,
};
