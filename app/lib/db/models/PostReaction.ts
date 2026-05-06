import mongoose, { Schema, Document } from 'mongoose';
export interface IPostReaction extends Document {
    post_slug: string;
    user_id: mongoose.Types.ObjectId;
    reaction_type: 'like' | 'dislike';
    created_at: Date;
    updated_at: Date;
}
const PostReactionSchema = new Schema<IPostReaction>({
    post_slug: { type: String, required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reaction_type: { type: String, enum: ['like', 'dislike'], required: true },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
// Ensure unique constraint per user per post
PostReactionSchema.index({ post_slug: 1, user_id: 1 }, { unique: true });
export default mongoose.models.PostReaction || mongoose.model<IPostReaction>('PostReaction', PostReactionSchema);