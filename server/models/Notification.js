const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['new_application', 'interview_scheduled', 'application_accepted', 'application_rejected'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  meetLink: { type: String, default: '' },
  interviewDate: { type: String, default: '' },
  interviewTime: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
