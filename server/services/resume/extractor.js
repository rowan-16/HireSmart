/**
 * Resume Feature Extractor
 * Extracts structured job-relevant information from anonymized resume text.
 * Uses keyword matching, pattern recognition, and NLP heuristics.
 */

// ─── Comprehensive skill dictionaries ───────────────────────────────────────
const TECHNICAL_SKILLS = [
  // Languages
  'python','javascript','typescript','java','c++','c#','c','go','rust','ruby',
  'php','swift','kotlin','scala','r','matlab','perl','shell','bash','powershell',
  'sql','nosql','graphql','html','css','xml','json','yaml',
  // Frameworks & Libraries
  'react','angular','vue','svelte','next.js','nuxt','express','fastapi','django',
  'flask','spring','laravel','rails','tensorflow','pytorch','keras','scikit-learn',
  'pandas','numpy','matplotlib','seaborn','opencv','nltk','spacy','hugging face',
  'transformers','langchain','openai','llm','node.js','electron','redux',
  // Cloud & DevOps
  'aws','azure','gcp','google cloud','docker','kubernetes','terraform','ansible',
  'jenkins','github actions','ci/cd','linux','unix','nginx','apache','heroku',
  'firebase','supabase','vercel','netlify',
  // Databases
  'mongodb','postgresql','mysql','sqlite','redis','elasticsearch','cassandra',
  'dynamodb','oracle','mssql','neo4j','pinecone','weaviate','chroma',
  // AI/ML
  'machine learning','deep learning','neural network','computer vision','nlp',
  'natural language processing','reinforcement learning','data science',
  'data analysis','data engineering','mlops','llm','generative ai','rag',
  'vector database','embedding','fine-tuning','prompt engineering',
  // Other
  'rest api','microservices','agile','scrum','git','jira','confluence',
  'tableau','power bi','excel','jupyter','anaconda','hadoop','spark','kafka',
  'blockchain','cybersecurity','networking','iot','robotics',
];

const SOFT_SKILLS = [
  'leadership','communication','teamwork','problem solving','critical thinking',
  'time management','adaptability','creativity','collaboration','mentoring',
  'project management','analytical thinking','attention to detail','presentation',
];

const EDUCATION_KEYWORDS = {
  degrees: ['phd','ph.d','doctorate','master','msc','mtech','m.tech','mba','mca',
            'bachelor','bsc','btech','b.tech','bca','be','b.e','associate','diploma','certification'],
  fields: ['computer science','software engineering','information technology',
           'data science','electrical engineering','mechanical engineering',
           'mathematics','statistics','physics','business','management','finance'],
};

const EXPERIENCE_SECTION_HEADERS = [
  'experience','work history','employment','professional background',
  'career','positions held','work experience',
];

const PROJECT_SECTION_HEADERS = [
  'projects','personal projects','academic projects','key projects','portfolio',
  'open source','contributions',
];

const CERT_KEYWORDS = [
  'aws certified','google certified','microsoft certified','azure','pmp','cissp',
  'cfa','cpa','comptia','oracle certified','salesforce','tensorflow developer',
  'coursera','udemy','edx','certification','certificate','certified',
];

// ─── Helper functions ────────────────────────────────────────────────────────

function normalizeText(text) {
  return text.toLowerCase().replace(/[^\w\s.]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractSkills(text) {
  const normalized = normalizeText(text);
  const found = { technical: [], soft: [] };

  TECHNICAL_SKILLS.forEach(skill => {
    // Use word boundary matching
    const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(normalized) && !found.technical.includes(skill)) {
      found.technical.push(skill);
    }
  });

  SOFT_SKILLS.forEach(skill => {
    const re = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(normalized) && !found.soft.includes(skill)) {
      found.soft.push(skill);
    }
  });

  return found;
}

function extractYearsOfExperience(text) {
  // Patterns like "5 years of experience", "3+ years", "2-4 years"
  const patterns = [
    /(\d+)\+?\s*years?\s*(of\s*)?(experience|work|professional)/gi,
    /experience\s*:?\s*(\d+)\+?\s*years?/gi,
    /(\d+)\s*years?\s*(and|&)\s*\d+\s*months?/gi,
  ];
  let maxYears = 0;
  patterns.forEach(p => {
    let m;
    const re = new RegExp(p.source, p.flags);
    while ((m = re.exec(text)) !== null) {
      const y = parseInt(m[1], 10);
      if (!isNaN(y) && y > maxYears && y < 50) maxYears = y;
    }
  });

  // Also try to calculate from employment dates
  const dateRanges = [...text.matchAll(/(\d{4})\s*[-–—to]+\s*(present|\d{4})/gi)];
  let totalCalcYears = 0;
  dateRanges.forEach(m => {
    const start = parseInt(m[1], 10);
    const end = m[2].toLowerCase() === 'present' ? new Date().getFullYear() : parseInt(m[2], 10);
    if (!isNaN(start) && !isNaN(end) && end > start && end - start < 40) {
      totalCalcYears += (end - start);
    }
  });

  return Math.max(maxYears, Math.min(totalCalcYears, 30));
}

function extractEducation(text) {
  const normalized = normalizeText(text);
  const found = [];
  EDUCATION_KEYWORDS.degrees.forEach(degree => {
    const re = new RegExp(`\\b${degree}\\b`, 'i');
    if (re.test(normalized)) {
      // Try to extract field
      const fieldMatch = EDUCATION_KEYWORDS.fields.find(f => new RegExp(`\\b${f}\\b`, 'i').test(normalized));
      found.push({ degree, field: fieldMatch || '', institution: '' });
    }
  });
  return found;
}

function extractCertifications(text) {
  const normalized = normalizeText(text);
  const found = [];
  CERT_KEYWORDS.forEach(cert => {
    const re = new RegExp(`\\b${cert.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (re.test(normalized) && !found.includes(cert)) {
      found.push(cert);
    }
  });
  return found;
}

function extractProjects(text) {
  const projects = [];
  const lines = text.split('\n');
  let inProjectSection = false;
  let currentProject = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();

    if (PROJECT_SECTION_HEADERS.some(h => lineLower.includes(h) && line.length < 60)) {
      inProjectSection = true;
      continue;
    }

    if (inProjectSection) {
      // Detect end of section
      if (EXPERIENCE_SECTION_HEADERS.some(h => lineLower.includes(h) && line.length < 60) ||
          EDUCATION_KEYWORDS.degrees.some(d => lineLower.startsWith(d))) {
        inProjectSection = false;
        continue;
      }

      if (line.length > 10 && line.length < 120 && !line.startsWith('•') && !line.startsWith('-')) {
        if (currentProject) projects.push(currentProject);
        // Extract technologies from line
        const techs = extractSkills(line).technical.slice(0, 5);
        currentProject = { title: line.substring(0, 100), description: '', technologies: techs };
      } else if (currentProject && line.length > 0) {
        currentProject.description += line + ' ';
      }
    }
  }
  if (currentProject) projects.push(currentProject);
  return projects.slice(0, 10);
}

function extractExperience(text) {
  const experiences = [];
  const lines = text.split('\n');
  let inExpSection = false;
  let current = null;

  const rolePatterns = [
    /\b(engineer|developer|analyst|scientist|manager|director|lead|architect|consultant|designer|specialist|coordinator|intern|associate|senior|junior|staff|principal)\b/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineLower = line.toLowerCase();

    if (EXPERIENCE_SECTION_HEADERS.some(h => lineLower.includes(h) && line.length < 60)) {
      inExpSection = true;
      continue;
    }

    if (inExpSection) {
      // Section end check
      if (PROJECT_SECTION_HEADERS.some(h => lineLower.includes(h) && line.length < 60)) {
        inExpSection = false;
        continue;
      }

      const dateMatch = line.match(/(\d{4})\s*[-–—to]+\s*(present|\d{4})/i);
      const isRoleLine = rolePatterns.some(p => p.test(line)) && line.length < 100;

      if (isRoleLine && dateMatch) {
        if (current) experiences.push(current);
        const start = parseInt(dateMatch[1], 10);
        const endStr = dateMatch[2].toLowerCase();
        const end = endStr === 'present' ? new Date().getFullYear() : parseInt(endStr, 10);
        current = {
          role: line.replace(dateMatch[0], '').trim().substring(0, 80),
          company: '',
          years: Math.max(0, end - start),
          responsibilities: [],
        };
      } else if (current && (line.startsWith('•') || line.startsWith('-'))) {
        current.responsibilities.push(line.replace(/^[•\-]\s*/, '').trim());
      }
    }
  }
  if (current) experiences.push(current);
  return experiences.slice(0, 10);
}

// ─── Main extraction function ─────────────────────────────────────────────────

function extractResumeFeatures(anonymizedText) {
  const skills = extractSkills(anonymizedText);
  const yearsOfExperience = extractYearsOfExperience(anonymizedText);
  const education = extractEducation(anonymizedText);
  const certifications = extractCertifications(anonymizedText);
  const projects = extractProjects(anonymizedText);
  const experienceDetails = extractExperience(anonymizedText);

  // All skills combined
  const allSkills = [...new Set([...skills.technical, ...skills.soft])];

  return {
    skills: allSkills,
    technicalSkills: skills.technical,
    softSkills: skills.soft,
    yearsOfExperience,
    experienceDetails,
    projects,
    education,
    certifications,
    achievements: [],
    technologies: skills.technical,
  };
}

module.exports = { extractResumeFeatures };
