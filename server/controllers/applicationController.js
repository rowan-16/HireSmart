const Application = require('../models/Application');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { extractResumeFeatures } = require('../services/resume/extractor');
const { parseResume } = require('../services/resume/parser');
const { computeRubricScore } = require('../services/ranking/rubricScorer');
const { logEvent } = require('../services/audit/auditLogger');
const { uploadToCloudinary } = require('../services/cloudinary');

// POST /api/applications/apply
exports.applyForJob = async (req, res) => {
  try {
    const candidateId = req.user._id;
    const { jobId, resumeText, resumeUrl } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Job ID is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Check if candidate already applied
    const existing = await Application.findOne({ jobId, candidateId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already applied for this job' });
    }

    let finalResumeUrl = resumeUrl || req.user.resumeUrl || '';
    let textToAnalyze = resumeText || '';

    // Handle file upload if attached
    if (req.file) {
      const ext = req.file.originalname.split('.').pop().toLowerCase();
      const fileParsedText = await parseResume(req.file.path, ext);
      if (fileParsedText) textToAnalyze = fileParsedText;

      // Upload to Cloudinary (with local fallback if keys not set)
      const cloudUrl = await uploadToCloudinary(req.file.path);
      finalResumeUrl = cloudUrl || `/uploads/${req.file.filename}`;
    }

    if (!textToAnalyze || textToAnalyze.trim().length === 0) {
      textToAnalyze = req.user.headline || `${req.user.name} Candidate Profile`;
    }

    const extractedData = extractResumeFeatures(textToAnalyze);

    // Calculate match score against job requirements
    const requiredSkills = job.requiredSkills || [];
    const candidateSkills = extractedData.skills || [];
    
    // Skill match score
    let skillScore = 40;
    if (requiredSkills.length > 0) {
      const matchCount = requiredSkills.filter(s => 
        candidateSkills.some(cs => cs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cs.toLowerCase()))
      ).length;
      skillScore = Math.min(100, Math.round((matchCount / requiredSkills.length) * 100));
    } else {
      skillScore = 80;
    }

    const scores = computeRubricScore(
      { extractedData, scores: { skillScore } },
      job,
      0
    );

    const matchPercentage = Math.max(45, Math.min(99, Math.round(scores.finalScore)));

    // Create Application
    const application = await Application.create({
      jobId,
      candidateId,
      candidateName: req.user.name,
      candidateEmail: req.user.email,
      resumeUrl: finalResumeUrl,
      parsedSkills: candidateSkills,
      yearsOfExperience: extractedData.yearsOfExperience || 0,
      matchPercentage,
      scores,
      status: 'applied',
    });

    // Update job candidate count
    job.candidateCount = (job.candidateCount || 0) + 1;
    await job.save();

    // Create notification for job creator (recruiter)
    await Notification.create({
      userId: job.createdBy,
      type: 'new_application',
      title: 'New Candidate Applied',
      message: `${req.user.name} applied for "${job.title}" with a ${matchPercentage}% AI match score.`,
      jobId: job._id,
      applicationId: application._id,
    });

    await logEvent('candidate_analyzed', {
      userId: candidateId,
      jobId: job._id,
      metadata: { matchPercentage },
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application,
    });
  } catch (err) {
    console.error('Apply error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/applications/job/:jobId (Recruiter view)
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const applications = await Application.find({ jobId })
      .populate('candidateId', 'name email avatar role')
      .sort({ matchPercentage: -1 });

    res.json({ success: true, count: applications.length, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/applications/my-applications (Job seeker view)
exports.getCandidateApplications = async (req, res) => {
  try {
    const candidateId = req.user._id;
    const applications = await Application.find({ candidateId })
      .populate('jobId', 'title department category location type minExperience requiredSkills')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: applications.length, applications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/applications/:id/status (Recruiter 3-option decision: reject, accept, interview)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, date, time, meetLink, notes, rejectionFeedback } = req.body;

    if (!['accept', 'accepted', 'reject', 'rejected', 'interview'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be accept, reject, or interview' });
    }

    const application = await Application.findById(id).populate('jobId');
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    let updatedStatus = status;
    if (status === 'accept') updatedStatus = 'accepted';
    if (status === 'reject') updatedStatus = 'rejected';

    application.status = updatedStatus;

    if (updatedStatus === 'interview') {
      application.interviewDetails = {
        date: date || '',
        time: time || '',
        meetLink: meetLink || '',
        notes: notes || '',
      };
    } else if (updatedStatus === 'rejected') {
      application.rejectionFeedback = rejectionFeedback || 'The role requires different technical skills or experience levels.';
    }

    await application.save();

    // Create Notification for the Candidate
    let notifType = 'application_accepted';
    let notifTitle = 'Application Update';
    let notifMessage = `Your application for "${application.jobId.title}" has been updated.`;

    if (updatedStatus === 'interview') {
      notifType = 'interview_scheduled';
      notifTitle = '🎯 Interview Invitation!';
      notifMessage = `You are invited to an interview for "${application.jobId.title}" on ${date || 'TBD'} at ${time || 'TBD'}. Join Google Meet: ${meetLink || 'Link provided in details'}`;
    } else if (updatedStatus === 'accepted') {
      notifType = 'application_accepted';
      notifTitle = '🎉 Application Accepted!';
      notifMessage = `Congratulations! Your application for "${application.jobId.title}" has been accepted by the company.`;
    } else if (updatedStatus === 'rejected') {
      notifType = 'application_rejected';
      notifTitle = 'Application Decision & Feedback';
      notifMessage = `Your application for "${application.jobId.title}" was reviewed. Feedback from company: "${application.rejectionFeedback}"`;
    }

    await Notification.create({
      userId: application.candidateId,
      type: notifType,
      title: notifTitle,
      message: notifMessage,
      jobId: application.jobId._id,
      applicationId: application._id,
      meetLink: meetLink || '',
      interviewDate: date || '',
      interviewTime: time || '',
    });

    res.json({
      success: true,
      message: `Application status updated to ${updatedStatus}`,
      application,
    });
  } catch (err) {
    console.error('Update application status error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
