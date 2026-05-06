import mongoose, { Schema, Document } from 'mongoose';

export interface ISearchHistory extends Document {
    user_id: mongoose.Types.ObjectId;
    type: 'flight' | 'hotel';
    search_state: any;
}

const SearchHistorySchema = new Schema<ISearchHistory>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['flight', 'hotel'], required: true },
    search_state: { type: Schema.Types.Mixed, required: true },
}, { timestamps: true });

export default mongoose.models.SearchHistory || mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema);