import mongoose, { Schema, Document } from 'mongoose';
export interface IVerificationToken extends Document {
  user_id: mongoose.Types.ObjectId;
  token: string;
  expires: Date;
}
const VerificationTokenSchema = new Schema<IVerificationToken>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expires: { type: Date, required: true }
}, {
  timestamps: { createdAt: 'created_at' }
});
export default mongoose.models.VerificationToken || mongoose.model<IVerificationToken>('VerificationToken', VerificationTokenSchema);