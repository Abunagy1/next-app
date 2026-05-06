import { Schema } from 'mongoose';

export interface IPost {
  slug: string;
  user_id: Schema.Types.ObjectId;
  title: string;
  content: string;
  images?: string[];
  created_at: Date;
  updated_at: Date;
}

const postSchema = new Schema<IPost>(
  {
    slug: { type: String, required: true, unique: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    images: { type: [String] },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default postSchema;