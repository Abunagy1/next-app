import mongoose, { Schema, Document } from 'mongoose';
export interface IPasswordResetToken extends Document {
  user_id: mongoose.Types.ObjectId;
  token: string;
  expires: Date;
}
const PasswordResetTokenSchema = new Schema<IPasswordResetToken>({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  expires: { type: Date, required: true }
}, {
  timestamps: { createdAt: 'created_at' }
});
export default mongoose.models.PasswordResetToken || mongoose.model<IPasswordResetToken>('PasswordResetToken', PasswordResetTokenSchema);