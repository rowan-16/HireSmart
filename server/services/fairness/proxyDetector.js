/**
 * Proxy Bias Detector
 * Flags information that could indirectly reveal protected characteristics.
 * Detected items are EXCLUDED from ranking — only flagged in audit.
 */

const PROXY_PATTERNS = [
  // Demographic organizations
  { pattern: /\b(women in tech|women in stem|minority scholar|diversity fellow|lgbtq\+?|gay|lesbian|transgender|black engineer|hispanic society|latino|latina|latinx|asian american|native american|indigenous)\b/gi, category: 'demographic_organization', risk: 'May reveal racial or gender identity' },
  // Religious indicators
  { pattern: /\b(church|mosque|temple|synagogue|islamic|hindu|buddhist|jewish|christian fellowship)\b/gi, category: 'religious_indicator', risk: 'May reveal religious affiliation' },
  // Age indicators
  { pattern: /\b(class of \d{4}|graduated\s+(?:in\s+)?\d{4}|born\s+in\s+\d{4})\b/gi, category: 'age_indicator', risk: 'May reveal approximate age' },
  // Location-based
  { pattern: /\b(from [A-Z][a-z]+ city|native of|grew up in)\b/gi, category: 'location_indicator', risk: 'May reveal geographic origin' },
  // Military / national service
  { pattern: /\b(military service|served in the army|navy|air force|marines|veteran)\b/gi, category: 'military_status', risk: 'May reveal military service / age / national origin' },
  // Fraternities / sororities
  { pattern: /\b(fraternity|sorority|alpha phi|kappa|sigma|delta|omega)\b/gi, category: 'social_org', risk: 'May be correlated with demographic factors' },
];

function detectProxyRisks(text) {
  const risks = [];
  PROXY_PATTERNS.forEach(({ pattern, category, risk }) => {
    const matches = [...(text.matchAll ? text.matchAll(pattern) : [])];
    // Use string match fallback
    const found = text.match(new RegExp(pattern.source, pattern.flags)) || [];
    found.forEach(m => {
      risks.push({ text: m, category, risk });
    });
  });
  // Deduplicate
  const seen = new Set();
  return risks.filter(r => {
    const key = r.text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function classifyProxyRiskLevel(risks) {
  if (risks.length === 0) return 'Low';
  if (risks.length <= 2) return 'Medium';
  return 'High';
}

module.exports = { detectProxyRisks, classifyProxyRiskLevel };
