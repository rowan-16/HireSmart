const Job = require('../models/Job');
const AuditLog = require('../models/AuditLog');
const { logEvent } = require('../services/audit/auditLogger');

// Extract requirements from job description using keyword matching
function extractRequirementsFromDescription(description) {
  const text = description.toLowerCase();
  const SKILL_KEYWORDS = [
    'python','javascript','typescript','java','c++','c#','go','rust','ruby','php','swift','kotlin',
    'sql','nosql','graphql','html','css','react','angular','vue','next.js','express','django','flask',
    'spring','tensorflow','pytorch','keras','scikit-learn','pandas','numpy','aws','azure','gcp',
    'docker','kubernetes','terraform','mongodb','postgresql','mysql','redis','elasticsearch',
    'machine learning','deep learning','nlp','data science','computer vision','devops','ci/cd',
    'rest api','microservices','agile','scrum','git','linux','node.js','fastapi',
  ];

  const found = SKILL_KEYWORDS.filter(skill => text.includes(skill));

  // Extract experience requirement
  const expMatch = text.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|work)/i);
  const minExperience = expMatch ? parseInt(expMatch[1], 10) : 0;

  // Extract education
  let educationRequirement = '';
  if (text.includes('phd') || text.includes('doctorate')) educationRequirement = 'PhD';
  else if (text.includes("master's") || text.includes('masters') || text.includes('msc') || text.includes('m.tech')) educationRequirement = "Master's";
  else if (text.includes("bachelor's") || text.includes('bachelors') || text.includes('bsc') || text.includes('b.tech') || text.includes('degree')) educationRequirement = "Bachelor's";

  return { extractedSkills: [...new Set(found)], minExperience, educationRequirement };
}

// POST /api/jobs
exports.createJob = async (req, res) => {
  try {
    const { title, description, category, requiredSkills, preferredSkills,
      minExperience, educationRequirement, certifications, scoringWeights, minScreeningScore } = req.body;

    // Auto-extract if skills not provided
    let reqSkills = requiredSkills || [];
    let prefSkills = preferredSkills || [];
    let minExp = minExperience || 0;
    let eduReq = educationRequirement || '';

    if (description && reqSkills.length === 0) {
      const extracted = extractRequirementsFromDescription(description);
      reqSkills = extracted.extractedSkills;
      if (!minExp) minExp = extracted.minExperience;
      if (!eduReq) eduReq = extracted.educationRequirement;
    }

    const job = await Job.create({
      title, description, category: category || 'General',
      requiredSkills: reqSkills, preferredSkills: prefSkills,
      minExperience: minExp, educationRequirement: eduReq,
      certifications: certifications || [],
      scoringWeights: scoringWeights || { skills: 0.5, experience: 0.25, projects: 0.15, education: 0.10 },
      minScreeningScore: minScreeningScore || 50,
      createdBy: req.user._id,
    });

    await logEvent('job_created', { jobId: job._id, userId: req.user._id, metadata: { title } });
    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/jobs
exports.getJobs = async (req, res) => {
  try {
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };
    const rawJobs = await Job.find(filter).sort('-createdAt');

    const Application = require('../models/Application');
    const jobs = await Promise.all(rawJobs.map(async (j) => {
      const count = await Application.countDocuments({ jobId: j._id });
      const obj = j.toObject();
      obj.candidateCount = count;
      return obj;
    }));

    res.json({ success: true, jobs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/jobs/:id
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/jobs/:id
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    await logEvent('job_updated', { jobId: job._id, userId: req.user._id });
    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/jobs/extract-requirements
exports.extractRequirements = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description) return res.status(400).json({ success: false, message: 'Description required' });
    const extracted = extractRequirementsFromDescription(description);
    res.json({ success: true, ...extracted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
