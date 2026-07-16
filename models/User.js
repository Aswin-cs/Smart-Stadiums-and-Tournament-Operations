import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  googleId: { type: String },
}, { timestamps: true });

/* istanbul ignore next */
export default mongoose.models.User || mongoose.model('User', UserSchema);
