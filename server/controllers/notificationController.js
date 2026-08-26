const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/notifications/:id/read or /api/notifications/:id
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === 'read-all' || id === 'all' || !mongoose.Types.ObjectId.isValid(id)) {
      return exports.markAllAsRead(req, res);
    }

    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
