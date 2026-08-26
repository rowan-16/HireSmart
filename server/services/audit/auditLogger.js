/**
 * Audit Logger — records all important system actions with full context.
 */
const AuditLog = require('../../models/AuditLog');

async function logEvent(eventType, data = {}) {
  try {
    await AuditLog.create({
      eventType,
      candidateId: data.candidateId || null,
      jobId: data.jobId || null,
      userId: data.userId || null,
      modelVersion: data.modelVersion || '1.0.0',
      metadata: data.metadata || {},
      protectedAttributesUsed: false,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[AuditLog] Failed to write audit event:', err.message);
  }
}

module.exports = { logEvent };
