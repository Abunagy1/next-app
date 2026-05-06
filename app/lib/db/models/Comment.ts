import mongoose, { Schema, Document } from 'mongoose';
export interface IComment extends Document {
    post_slug: string;
    user_id: mongoose.Types.ObjectId;
    parent_id?: mongoose.Types.ObjectId | null;
    content: string;
    created_at: Date;
    updated_at: Date;
}
const CommentSchema = new Schema<IComment>({
    post_slug: { type: String, required: true, index: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    parent_id: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    content: { type: String, required: true },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);