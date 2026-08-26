const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadResumes, getResumesByJob, getResumeStatus } = require('../controllers/resumeController');

router.use(protect);
router.post('/upload', upload.array('resumes', 50), uploadResumes);
router.get('/job/:jobId', getResumesByJob);
router.get('/status/:id', getResumeStatus);

module.exports = router;
