import mongoose from 'mongoose';

const RateLimitSchema = new mongoose.Schema({
  identifier: { type: String, required: true, unique: true },
  submissionsCount: { type: Number, default: 0 },
  notificationsCount: { type: Number, default: 0 },
  lastResetDate: { type: Date, default: Date.now },
});

/* istanbul ignore next */
export default mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);
