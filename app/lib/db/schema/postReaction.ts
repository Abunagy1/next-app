import { Schema } from 'mongoose';

const postReactionSchema = new Schema({
  post_slug: { type: String, required: true, index: true },
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reaction_type: { type: String, enum: ['like', 'dislike'], required: true },
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

postReactionSchema.index({ post_slug: 1, user_id: 1 }, { unique: true });

export default postReactionSchema;