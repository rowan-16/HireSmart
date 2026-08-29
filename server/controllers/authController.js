const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logEvent } = require('../services/audit/auditLogger');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email, and password required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create({ name, email, password, role: role || 'recruiter' });
    await logEvent('register', { userId: user._id, metadata: { email: user.email } });
    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || '',
        resumeUrl: user.resumeUrl || '',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const cleanEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        redirectToRegister: true,
        message: 'Account does not exist. Please sign up to create your account.',
      });
    }

    if (user.password) {
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
      }
    } else {
      user.password = password;
    }

    if (role && user.role !== 'admin') {
      user.role = role;
    }

    if (user.email.includes('rocklandrowan') && (!user.name || user.name.toLowerCase().includes('jowan') || user.name === 'rocklandrowanm')) {
      user.name = 'M Rockland Rowan';
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    await logEvent('login', { userId: user._id, metadata: { email: user.email } });
    const token = signToken(user._id);

    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4285F4&color=fff&size=128&bold=true`;

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || fallbackAvatar,
        resumeUrl: user.resumeUrl || '',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  if (req.user && req.user.email && req.user.email.includes('rocklandrowan')) {
    if (!req.user.name || req.user.name.toLowerCase().includes('jowan') || req.user.name === 'rocklandrowanm') {
      req.user.name = 'M Rockland Rowan';
      await req.user.save({ validateBeforeSave: false });
    }
  }

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.name || 'User')}&background=4285F4&color=fff&size=128&bold=true`;
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      avatar: req.user.avatar || fallbackAvatar,
      resumeUrl: req.user.resumeUrl || '',
      headline: req.user.headline || '',
      phone: req.user.phone || '',
      location: req.user.location || '',
      skills: req.user.skills || [],
      yearsOfExperience: req.user.yearsOfExperience || 0,
      bio: req.user.bio || '',
      linkedin: req.user.linkedin || '',
      github: req.user.github || '',
    },
  });
};

// POST /api/auth/google (handled by passport, this is callback)
exports.googleCallback = (req, res) => {
  const token = signToken(req.user._id);
  const clientUrl = (req.headers.referer ? new URL(req.headers.referer).origin : (process.env.CLIENT_URL || 'https://hire-smart-sandy.vercel.app')).replace(/\/$/, '');
  const avatarToSend = req.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.user.name)}&background=4285F4&color=fff&size=128&bold=true`;
  res.redirect(`${clientUrl}/auth/google/success?token=${token}&id=${req.user._id}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&role=${req.user.role}&avatar=${encodeURIComponent(avatarToSend)}`);
};

// DELETE /api/auth/delete-account
exports.deleteAccount = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin accounts cannot be deleted' });
    }
    const userId = req.user._id;
    await User.findByIdAndDelete(userId);
    await logEvent('user_deleted', { userId });
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, avatar, headline, phone, location, skills, yearsOfExperience, bio, linkedin, github } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    if (headline !== undefined) user.headline = headline;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (skills) user.skills = skills;
    if (yearsOfExperience !== undefined) user.yearsOfExperience = Number(yearsOfExperience);
    if (bio !== undefined) user.bio = bio;
    if (linkedin !== undefined) user.linkedin = linkedin;
    if (github !== undefined) user.github = github;

    await user.save({ validateBeforeSave: false });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        resumeUrl: user.resumeUrl || '',
        headline: user.headline,
        phone: user.phone,
        location: user.location,
        skills: user.skills,
        yearsOfExperience: user.yearsOfExperience,
        bio: user.bio,
        linkedin: user.linkedin,
        github: user.github,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
