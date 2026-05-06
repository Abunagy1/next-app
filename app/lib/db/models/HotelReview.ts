import mongoose, { Schema, Document } from 'mongoose';

export interface IHotelReview extends Document {
    hotelId: mongoose.Types.ObjectId;
    slug?: string;
    reviewerId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    flagged: mongoose.Types.ObjectId[];
}

const HotelReviewSchema = new Schema<IHotelReview>({
    hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
    slug: String,
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    flagged: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.models.HotelReview || mongoose.model<IHotelReview>('HotelReview', HotelReviewSchema);