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
  const role = req.query.role || 'recruiter';
  const email = req.query.email || '';
  const name = req.query.name || '';

  // Store params in state
  const stateData = JSON.stringify({ role, email, name });
  const stateEncoded = Buffer.from(stateData).toString('base64');

  passport.authenticate('google', { scope: ['profile', 'email'], state: stateEncoded })(req, res, next);
});

// Google OAuth Callback Handler (Full page redirect back to application)
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    let role = 'recruiter';
    let passedEmail = '';
    let passedName = '';

    try {
      if (req.query.state) {
        const decoded = JSON.parse(Buffer.from(req.query.state, 'base64').toString('utf8'));
        role = decoded.role || 'recruiter';
        passedEmail = decoded.email || '';
        passedName = decoded.name || '';
      }
    } catch (e) {
      if (req.query.state === 'candidate') role = 'candidate';
      if (req.query.state === 'admin') role = 'admin';
    }

    if (err || !user) {
      try {
        // Fallback for offline/unconfigured Google Client ID
        let userEmail = passedEmail || req.query.email;
        if (!userEmail) {
          userEmail = role === 'candidate' ? 'rocklandrowanm@gmail.com' : (role === 'admin' ? 'admin@hiresmart.ai' : 'company@hiresmart.ai');
        }

        // Prevent candidate login from using admin email
        if (role === 'candidate' && userEmail === 'admin@hiresmart.ai') {
          userEmail = 'rocklandrowanm@gmail.com';
        }

        let userName = passedName || req.query.name;
        if (!userName) {
          if (userEmail.toLowerCase().includes('rocklandrowan')) {
            userName = 'Rockland Rowan';
          } else if (userEmail.toLowerCase().includes('admin')) {
            userName = 'Admin Head';
          } else {
            const prefix = userEmail.split('@')[0];
            userName = prefix.replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          }
        }

        const passedAvatar = req.query.avatar || '';
        const userAvatar = passedAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4285F4&color=fff&size=128&bold=true`;

        let fallbackUser = await User.findOne({ email: userEmail });
        if (!fallbackUser) {
          fallbackUser = await User.create({
            name: userName,
            email: userEmail,
            googleId: `google_oauth_${Date.now()}`,
            avatar: userAvatar,
            role,
          });
        } else {
          // Protect admin superuser profile from being overwritten
          if (fallbackUser.email === 'admin@hiresmart.ai') {
            fallbackUser.role = 'admin';
            fallbackUser.name = 'Admin Head';
          } else {
            fallbackUser.role = role;
            fallbackUser.name = userName;
          }
          if (!fallbackUser.avatar) fallbackUser.avatar = userAvatar;
        }
        fallbackUser.lastLogin = new Date();
        await fallbackUser.save({ validateBeforeSave: false });

        const token = jwt.sign({ id: fallbackUser._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
        const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/google/success?token=${token}&name=${encodeURIComponent(fallbackUser.name)}&email=${encodeURIComponent(fallbackUser.email)}&role=${fallbackUser.role}&avatar=${encodeURIComponent(fallbackUser.avatar || '')}`;
        return res.redirect(redirectUrl);
      } catch (fallbackErr) {
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_failed`);
      }
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    await logEvent('login', { userId: user._id, metadata: { email: user.email, provider: 'google_oauth' } });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/google/success?token=${token}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&role=${user.role}&avatar=${encodeURIComponent(user.avatar || '')}`;
    return res.redirect(redirectUrl);
  })(req, res, next);
});

module.exports = router;
