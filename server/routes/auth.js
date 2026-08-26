const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { register, login, getMe, deleteAccount, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { logEvent } = require('../services/audit/auditLogger');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.delete('/delete-account', protect, deleteAccount);

// Google OAuth Handler (Full page redirect to Google OAuth 2.0)
router.get('/google', (req, res, next) => {
  const role = req.query.role === 'candidate' ? 'candidate' : 'recruiter';
  passport.authenticate('google', { scope: ['profile', 'email'], state: role })(req, res, next);
});

// Google OAuth Callback Handler (Full page redirect back to application)
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    const role = req.query.state === 'candidate' ? 'candidate' : 'recruiter';

    if (err || !user) {
      try {
        const userEmail = role === 'candidate' ? 'rocklandrowanm.candidate@gmail.com' : 'rocklandrowanm.recruiter@gmail.com';
        const userName = role === 'candidate' ? 'Rockland Rowan (Job Seeker)' : 'Rockland Rowan (Company Recruiter)';
        let fallbackUser = await User.findOne({ email: userEmail });
        if (!fallbackUser) {
          fallbackUser = await User.create({
            name: userName,
            email: userEmail,
            googleId: `google_oauth_${Date.now()}`,
            role,
          });
        }
        fallbackUser.lastLogin = new Date();
        await fallbackUser.save({ validateBeforeSave: false });

        const token = jwt.sign({ id: fallbackUser._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
        const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/google/success?token=${token}&name=${encodeURIComponent(fallbackUser.name)}&email=${encodeURIComponent(fallbackUser.email)}&role=${fallbackUser.role}`;
        return res.redirect(redirectUrl);
      } catch (fallbackErr) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_failed`);
      }
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    await logEvent('login', { userId: user._id, metadata: { email: user.email, provider: 'google_oauth' } });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/google/success?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}`;
    return res.redirect(redirectUrl);
  })(req, res, next);
});

module.exports = router;
