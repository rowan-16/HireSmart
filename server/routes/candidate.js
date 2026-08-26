const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { analyzeResume, getRecommendedJobs } = require('../controllers/candidateController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.use(protect);

router.post('/analyze-resume', upload.single('resume'), analyzeResume);
router.get('/recommended-jobs', getRecommendedJobs);

module.exports = router;
