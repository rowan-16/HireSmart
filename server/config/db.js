const mongoose = require('mongoose');
const Job = require('../models/Job');
const User = require('../models/User');

const seedDefaultJobs = async () => {
  try {
    // Ensure Superuser Admin account exists and has role 'admin' and name 'Admin Head'
    let adminUser = await User.findOne({ email: 'admin@hiresmart.ai' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin Head',
        email: 'admin@hiresmart.ai',
        password: 'admin123',
        role: 'admin',
        avatar: 'https://ui-avatars.com/api/?name=Admin%20Head&background=4285F4&color=fff&bold=true',
      });
      console.log('🔑 Superuser Admin created: admin@hiresmart.ai / admin123');
    } else {
      adminUser.name = 'Admin Head';
      adminUser.role = 'admin';
      await adminUser.save({ validateBeforeSave: false });
    }

    // Ensure Candidate account rocklandrowanm@gmail.com exists and has role 'candidate' and name 'Rockland Rowan'
    let candidateUser = await User.findOne({ email: 'rocklandrowanm@gmail.com' });
    if (!candidateUser) {
      candidateUser = await User.create({
        name: 'Rockland Rowan',
        email: 'rocklandrowanm@gmail.com',
        password: 'password123',
        role: 'candidate',
        avatar: 'https://ui-avatars.com/api/?name=Rockland%20Rowan&background=4285F4&color=fff&bold=true',
      });
    } else {
      candidateUser.name = 'Rockland Rowan';
      candidateUser.role = 'candidate';
      await candidateUser.save({ validateBeforeSave: false });
    }

    // Clear all jobs and applications as requested
    await Job.deleteMany({});
    const Application = require('../models/Application');
    await Application.deleteMany({});
    console.log('🧹 Cleaned up all jobs and applications from database.');

    const AuditLog = require('../models/AuditLog');
    const auditCount = await AuditLog.countDocuments();
    if (auditCount === 0) {
      console.log('📜 Seeding initial audit governance log events...');
      await AuditLog.create([
        {
          eventType: 'login',
          userId: adminUser._id,
          modelVersion: '1.0.0',
          protectedAttributesUsed: false,
          metadata: { email: adminUser.email, role: 'admin' },
        },
        {
          eventType: 'job_created',
          userId: adminUser._id,
          modelVersion: '1.0.0',
          protectedAttributesUsed: false,
          metadata: { title: 'Full Stack Developer', category: 'Engineering' },
        },
        {
          eventType: 'fairness_check_executed',
          userId: adminUser._id,
          modelVersion: '1.0.0',
          protectedAttributesUsed: false,
          metadata: { checkName: 'Disparate Impact Ratio Analysis', status: 'PASS', score: 0.98 },
        },
        {
          eventType: 'ranking_generated',
          candidateId: 'C-001',
          userId: adminUser._id,
          modelVersion: '1.0.0',
          protectedAttributesUsed: false,
          metadata: { candidateName: 'Rockland Rowan', topRank: 1, score: 94 },
        },
      ]);
      console.log('✅ Default audit logs seeded successfully!');
    }
  } catch (err) {
    console.warn('Auto-seed warning:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log(`MongoDB Connected (Local/Atlas): ${conn.connection.host}`);
    await seedDefaultJobs();
  } catch (error) {
    console.warn(`Atlas MongoDB connection failed (${error.message}). Trying local MongoDB / MongoMemoryServer fallback...`);
    try {
      // Try local MongoDB URI first
      const conn = await mongoose.connect('mongodb://127.0.0.1:27017/hiresmart', { serverSelectionTimeoutMS: 1500 });
      console.log(`MongoDB Connected (Local MongoDB): ${conn.connection.host}`);
      await seedDefaultJobs();
    } catch (localErr) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongoServer = await MongoMemoryServer.create({
          binary: { version: '6.0.4' }
        });
        const uri = mongoServer.getUri();
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected (In-Memory Database v6.0.4): ${conn.connection.host}`);
        await seedDefaultJobs();
      } catch (memErr) {
        console.error(`MongoDB In-Memory fallback failed: ${memErr.message}`);
        process.exit(1);
      }
    }
  }
};

module.exports = connectDB;
