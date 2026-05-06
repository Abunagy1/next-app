import { Schema } from 'mongoose';

export interface IPasswordResetToken {
  user_id: Schema.Types.ObjectId;
  token: string;
  expires: Date;
}

const passwordResetTokenSchema = new Schema<IPasswordResetToken>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    expires: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: 'created_at' },
  }
);

export default passwordResetTokenSchema;