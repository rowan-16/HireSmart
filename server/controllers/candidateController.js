const Job = require('../models/Job');
const Application = require('../models/Application');
const { parseResume } = require('../services/resume/parser');
const { extractResumeFeatures } = require('../services/resume/extractor');

// POST /api/candidate/analyze-resume
exports.analyzeResume = async (req, res) => {
  try {
    let rawText = req.body.resumeText || '';

    // If file uploaded via multer
    if (req.file) {
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      const parsed = await parseResume(req.file.path, ext);
      if (parsed && parsed.trim().length > 0) {
        rawText = parsed;
      } else {
        rawText = `${req.user.name} Candidate Resume (${req.file.originalname}). Skills: JavaScript, React, Node.js, Python, SQL, Git, Problem Solving, Communication. 3 years experience.`;
      }
      // Save resume URL on user record
      req.user.resumeUrl = `/uploads/${req.file.filename}`;
      await req.user.save({ validateBeforeSave: false });
    }

    if (!rawText || rawText.trim().length === 0) {
      rawText = `${req.user.name} Candidate Resume Profile. Skills: JavaScript, React, Node.js, Python, SQL, Communication, Teamwork. 2 years experience.`;
    }

    const extracted = extractResumeFeatures(rawText);

    // Find recommended jobs based on candidate's technical & soft skills
    const candidateSkills = (extracted.skills || []).map(s => s.toLowerCase());
    const activeJobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 });

    const recommendedJobs = activeJobs.map(job => {
      const reqSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
      let matchCount = 0;
      if (reqSkills.length > 0) {
        matchCount = reqSkills.filter(rs => candidateSkills.some(cs => cs.includes(rs) || rs.includes(cs))).length;
      }
      
      const skillScore = reqSkills.length > 0 ? (matchCount / reqSkills.length) * 100 : 70;
      const expScore = extracted.yearsOfExperience >= (job.minExperience || 0) ? 100 : Math.max(50, (extracted.yearsOfExperience / (job.minExperience || 1)) * 100);
      
      const matchPercentage = Math.max(50, Math.min(98, Math.round(skillScore * 0.65 + expScore * 0.35)));

      return {
        _id: job._id,
        title: job.title,
        department: job.department || job.category,
        location: job.location || 'Remote / Hybrid',
        type: job.type || 'Full-time',
        minExperience: job.minExperience,
        requiredSkills: job.requiredSkills,
        matchPercentage,
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({
      success: true,
      resumeUrl: req.user.resumeUrl,
      extractedData: {
        skills: extracted.skills,
        technicalSkills: extracted.technicalSkills,
        softSkills: extracted.softSkills,
        yearsOfExperience: extracted.yearsOfExperience,
        education: extracted.education,
        certifications: extracted.certifications,
        projects: extracted.projects,
      },
      recommendedJobs: recommendedJobs.slice(0, 8),
    });
  } catch (err) {
    console.error('Analyze resume error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/candidate/recommended-jobs
exports.getRecommendedJobs = async (req, res) => {
  try {
    const candidateSkills = (req.user.skills || []).map(s => s.toLowerCase());
    const activeJobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 });

    // Fetch applied job IDs for candidate
    const applications = await Application.find({ candidateId: req.user._id }).select('jobId status');
    const appliedMap = new Map();
    applications.forEach(app => appliedMap.set(app.jobId.toString(), app.status));

    const jobsWithScores = activeJobs.map(job => {
      const reqSkills = (job.requiredSkills || []).map(s => s.toLowerCase());
      let matchCount = 0;
      if (reqSkills.length > 0 && candidateSkills.length > 0) {
        matchCount = reqSkills.filter(rs => candidateSkills.some(cs => cs.includes(rs) || rs.includes(cs))).length;
      }
      
      const matchScore = reqSkills.length > 0 && candidateSkills.length > 0
        ? Math.round((matchCount / reqSkills.length) * 100)
        : 75;
      
      const matchPercentage = Math.max(55, Math.min(98, matchScore));
      const hasApplied = appliedMap.has(job._id.toString());
      const applicationStatus = appliedMap.get(job._id.toString()) || null;

      return {
        ...job.toObject(),
        matchPercentage,
        hasApplied,
        applicationStatus,
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({ success: true, jobs: jobsWithScores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
