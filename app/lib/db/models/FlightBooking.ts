import mongoose, { Schema, Document } from 'mongoose';

export interface IFlightBooking extends Document {
  pnrCode: string;
  userId: mongoose.Types.ObjectId;
  flightItineraryId: mongoose.Types.ObjectId;
  segmentIds: mongoose.Types.ObjectId[];
  passengers: mongoose.Types.ObjectId[];
  selectedSeats: Array<{ passengerId: mongoose.Types.ObjectId; seatId: mongoose.Types.ObjectId }>;
  fareBreakdown: any;
  totalFare: number;
  currency: string;
  promoCode?: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  ticketStatus: 'pending' | 'confirmed' | 'cancelled';
  cancellationInfo?: any;
  refundInfo?: any;
  paymentId?: mongoose.Types.ObjectId;
  earnedMiles?: number;
  guaranteedReservationUntil?: Date;
  userTimeZone?: string;
  source: 'web' | 'mobile' | 'api';
  bookedAt?: Date;
}

const FlightBookingSchema = new Schema<IFlightBooking>({
  pnrCode: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  flightItineraryId: { type: Schema.Types.ObjectId, ref: 'FlightItinerary', required: true },
  segmentIds: [{ type: Schema.Types.ObjectId, ref: 'FlightSegment' }],
  passengers: [{ type: Schema.Types.ObjectId, ref: 'Passenger' }],
  selectedSeats: [{
    passengerId: { type: Schema.Types.ObjectId, ref: 'Passenger' },
    seatId: { type: Schema.Types.ObjectId, ref: 'FlightSeat' }
  }],
  fareBreakdown: { type: Schema.Types.Mixed },
  totalFare: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  promoCode: { type: String, ref: 'PromoCode' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  ticketStatus: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
  cancellationInfo: { type: Schema.Types.Mixed },
  refundInfo: { type: Schema.Types.Mixed },
  paymentId: { type: Schema.Types.ObjectId, ref: 'FlightPayment' },
  earnedMiles: { type: Number, default: 0 },
  guaranteedReservationUntil: Date,
  userTimeZone: String,
  source: { type: String, enum: ['web', 'mobile', 'api'], default: 'web' },
  bookedAt: Date
}, { timestamps: true });

export default mongoose.models.FlightBooking || mongoose.model<IFlightBooking>('FlightBooking', FlightBookingSchema);