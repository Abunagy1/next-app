// app/lib/db/schema/verificationTokens.ts
import { Schema } from 'mongoose';
export interface IVerificationToken extends Document {
  identifier: string;
  token: string;
  expires: Date;
  created_at: Date;
}
const VerificationTokenSchema = new Schema<IVerificationToken>({
  identifier: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expires: { type: Date, required: true },
}, { timestamps: { createdAt: 'created_at' } });
export default VerificationTokenSchema;