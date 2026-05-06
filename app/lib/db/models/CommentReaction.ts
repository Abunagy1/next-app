import mongoose, { Schema, Document } from 'mongoose';
export interface ICommentReaction extends Document {
    comment_id: mongoose.Types.ObjectId;
    user_id: mongoose.Types.ObjectId;
    emoji: string;
    created_at: Date;
    updated_at: Date;
}
const CommentReactionSchema = new Schema<ICommentReaction>({
    comment_id: { type: Schema.Types.ObjectId, ref: 'Comment', required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    emoji: { type: String, required: true },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
// Ensure unique reaction per user per comment per emoji
CommentReactionSchema.index({ comment_id: 1, user_id: 1, emoji: 1 }, { unique: true });
export default mongoose.models.CommentReaction || mongoose.model<ICommentReaction>('CommentReaction', CommentReactionSchema);