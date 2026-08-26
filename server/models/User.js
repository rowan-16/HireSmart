const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6 },
  role: { type: String, enum: ['recruiter', 'admin', 'candidate'], default: 'recruiter' },
  googleId: { type: String },
  avatar: { type: String },
  headline: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  skills: [{ type: String }],
  yearsOfExperience: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  github: { type: String, default: '' },
  resumeUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
