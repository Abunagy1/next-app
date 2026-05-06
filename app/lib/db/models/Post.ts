import mongoose, { Schema, Document } from 'mongoose';
export interface IPost extends Document {
  slug: string;
  user_id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  images?: string[];
  createdAt: Date;
  updatedAt: Date;
}
const PostSchema = new Schema<IPost>({
  slug: { type: String, required: true, unique: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  images: { type: [String] }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);