/**
 * Anonymization Engine
 * Detects and removes PII from resume text before any scoring.
 * Uses regex patterns, dictionaries, and custom rules.
 * Protected attributes are NEVER passed to the ranking engine.
 */

// Common name indicators
const NAME_PREFIXES = /\b(mr\.?|mrs\.?|ms\.?|dr\.?|prof\.?)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*/gi;

// PII regex patterns
const PII_PATTERNS = [
  // Email
  { type: 'email', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: '[EMAIL REMOVED]' },
  // Phone numbers (various formats)
  { type: 'phone', pattern: /(\+?\d[\d\s\-().]{7,}\d)/g, replacement: '[PHONE REMOVED]' },
  // URLs / LinkedIn / social media
  { type: 'url', pattern: /https?:\/\/[^\s]+/g, replacement: '[URL REMOVED]' },
  { type: 'linkedin', pattern: /linkedin\.com\/in\/[^\s\/,)]+/gi, replacement: '[LINKEDIN REMOVED]' },
  { type: 'github', pattern: /github\.com\/[^\s\/,)]+/gi, replacement: '[GITHUB REMOVED]' },
  // Addresses — street patterns
  { type: 'address', pattern: /\d+\s+[A-Za-z]+(\s+[A-Za-z]+)*\s+(street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|court|ct|circle|way)\b[^,\n]*/gi, replacement: '[ADDRESS REMOVED]' },
  // ZIP / Postal codes
  { type: 'postal', pattern: /\b\d{5}(-\d{4})?\b/g, replacement: '[POSTAL REMOVED]' },
  // Date of birth
  { type: 'dob', pattern: /\b(date of birth|dob|born|d\.o\.b\.?)\s*:?\s*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/gi, replacement: '[DOB REMOVED]' },
  // Age
  { type: 'age', pattern: /\b(age\s*:?\s*\d{1,3}|\d{1,3}\s+years?\s+old)\b/gi, replacement: '[AGE REMOVED]' },
  // Gender
  { type: 'gender', pattern: /\b(gender\s*:?\s*(male|female|non-binary|transgender|prefer not to say))/gi, replacement: '[GENDER REMOVED]' },
  // Gendered pronouns in self-reference
  { type: 'pronoun', pattern: /\b(he\/him|she\/her|they\/them|his\/him|her\/she)\b/gi, replacement: '[PRONOUNS REMOVED]' },
  // Nationality / citizenship explicit
  { type: 'nationality', pattern: /\b(nationality|citizenship)\s*:?\s*[A-Za-z\s]+/gi, replacement: '[NATIONALITY REMOVED]' },
  // Photo reference
  { type: 'photo', pattern: /\b(photograph|photo|profile picture|image enclosed|see attached photo)\b/gi, replacement: '[PHOTO REFERENCE REMOVED]' },
  // National ID / SSN
  { type: 'ssn', pattern: /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, replacement: '[ID REMOVED]' },
  // Marital status
  { type: 'marital', pattern: /\b(married|single|divorced|widowed|marital status\s*:?\s*\w+)\b/gi, replacement: '[PERSONAL STATUS REMOVED]' },
];

// Demographic organizations that may reveal protected characteristics
const DEMOGRAPHIC_ORG_PATTERNS = [
  /\b(women in tech|women in stem|minority|diversity network|lgbtq\+?|black engineers|hispanic|latino|latina|latinx|asian american|native american)\b/gi,
];

function detectAndRemovePII(text) {
  const detectedPII = [];
  let anonymized = text;

  PII_PATTERNS.forEach(({ type, pattern, replacement }) => {
    const matches = [...(anonymized.matchAll ? anonymized.matchAll(pattern) : [])];
    // use replace + track
    anonymized = anonymized.replace(pattern, (match) => {
      detectedPII.push({ type, value: match.substring(0, 80), replacement });
      return replacement;
    });
  });

  // Name prefixes
  anonymized = anonymized.replace(NAME_PREFIXES, (match) => {
    detectedPII.push({ type: 'name', value: match.substring(0, 60), replacement: '[NAME REMOVED]' });
    return '[NAME REMOVED]';
  });

  return { anonymizedText: anonymized, piiDetected: detectedPII };
}

function detectProxyRisks(text) {
  const risks = [];
  DEMOGRAPHIC_ORG_PATTERNS.forEach((pattern) => {
    const matches = text.match(pattern) || [];
    matches.forEach((m) => {
      risks.push({
        text: m,
        risk: 'Potential demographic proxy attribute detected',
        category: 'demographic_organization',
      });
    });
  });
  // Check for religious indicators
  const religiousPattern = /\b(church|mosque|temple|synagogue|hindu|muslim|christian|jewish|buddhist)\b/gi;
  (text.match(religiousPattern) || []).forEach((m) => {
    risks.push({ text: m, risk: 'Potential religious reference', category: 'religious_indicator' });
  });
  return risks;
}

module.exports = { detectAndRemovePII, detectProxyRisks };
