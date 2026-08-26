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
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (role && user.role !== role) {
      const roleLabel = user.role === 'candidate' ? 'Job Seeker' : 'Company / Recruiter';
      return res.status(400).json({ success: false, message: `This email is registered as a ${roleLabel}. Please switch tabs.` });
    }
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    await logEvent('login', { userId: user._id, metadata: { email: user.email } });
    const token = signToken(user._id);
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
};

// POST /api/auth/google (handled by passport, this is callback)
exports.googleCallback = (req, res) => {
  const token = signToken(req.user._id);
  res.redirect(`${process.env.CLIENT_URL}/auth/google/success?token=${token}&name=${encodeURIComponent(req.user.name)}&email=${encodeURIComponent(req.user.email)}&role=${req.user.role}`);
};

// DELETE /api/auth/delete-account
exports.deleteAccount = async (req, res) => {
  try {
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
    const { name, headline, phone, location, skills, yearsOfExperience, bio, linkedin, github } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (name) user.name = name;
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
