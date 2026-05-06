import { Schema } from 'mongoose';

export interface IComment {
  post_slug: string;
  user_id: Schema.Types.ObjectId;
  parent_id?: Schema.Types.ObjectId | null;
  content: string;
  created_at: Date;
  updated_at: Date;
}

const commentSchema = new Schema<IComment>(
  {
    post_slug: { type: String, required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parent_id: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    content: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

export default commentSchema;