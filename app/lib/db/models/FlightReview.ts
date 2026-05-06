import mongoose, { Schema, Document } from 'mongoose';

export interface IFlightReview extends Document {
    airlineId: string;
    departureAirportId: string;
    arrivalAirportId: string;
    airplaneModelName: string;
    reviewerId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    flagged: mongoose.Types.ObjectId[];
}

const FlightReviewSchema = new Schema<IFlightReview>({
    airlineId: { type: String, ref: 'Airline', required: true },
    departureAirportId: { type: String, ref: 'Airport', required: true },
    arrivalAirportId: { type: String, ref: 'Airport', required: true },
    airplaneModelName: { type: String, required: true },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, required: true },
    flagged: [{ type: Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

export default mongoose.models.FlightReview || mongoose.model<IFlightReview>('FlightReview', FlightReviewSchema);