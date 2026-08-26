const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const {
  applyForJob,
  getJobApplications,
  getCandidateApplications,
  updateApplicationStatus,
} = require('../controllers/applicationController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(protect);

router.post('/apply', upload.single('resume'), applyForJob);
router.get('/job/:jobId', getJobApplications);
router.get('/my-applications', getCandidateApplications);
router.put('/:id/status', updateApplicationStatus);

module.exports = router;
