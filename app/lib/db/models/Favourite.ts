import mongoose, { Schema, Document } from 'mongoose';

export interface IFavourite extends Document {
    user_id: mongoose.Types.ObjectId;
    type: 'flight' | 'hotel';
    item_id: string;
    search_state?: any;
}

const FavouriteSchema = new Schema<IFavourite>({
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['flight', 'hotel'], required: true },
    item_id: { type: String, required: true },
    search_state: Schema.Types.Mixed,
}, { timestamps: true });

FavouriteSchema.index({ user_id: 1, type: 1, item_id: 1 }, { unique: true });

export default mongoose.models.Favourite || mongoose.model<IFavourite>('Favourite', FavouriteSchema);