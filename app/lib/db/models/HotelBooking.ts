import mongoose, { Schema, Document } from 'mongoose';

export interface IHotelBooking extends Document {
  userId: mongoose.Types.ObjectId;
  hotelId: mongoose.Types.ObjectId;
  rooms: mongoose.Types.ObjectId[];
  checkInDate: Date;
  checkOutDate: Date;
  guests: mongoose.Types.ObjectId[];
  fareBreakdown: any;
  totalPrice: number;
  bookingStatus: 'confirmed' | 'pending' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: 'card' | 'cash';
  paymentId?: mongoose.Types.ObjectId;
  refundInfo?: any;
  source: 'web' | 'mobile' | 'api';
  guaranteedReservationUntil?: Date;
  bookedAt?: Date;
}

const HotelBookingSchema = new Schema<IHotelBooking>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  rooms: [{ type: Schema.Types.ObjectId, ref: 'HotelRoom', required: true }],
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  guests: [{ type: Schema.Types.ObjectId, ref: 'HotelGuest' }],
  fareBreakdown: { type: Schema.Types.Mixed },
  totalPrice: Number,
  bookingStatus: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'pending' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentMethod: { type: String, enum: ['card', 'cash'] },
  paymentId: { type: Schema.Types.ObjectId, ref: 'HotelPayment' },
  refundInfo: { type: Schema.Types.Mixed },
  source: { type: String, enum: ['web', 'mobile', 'api'], default: 'web' },
  guaranteedReservationUntil: Date,
  bookedAt: Date
}, { timestamps: true });

export default mongoose.models.HotelBooking || mongoose.model<IHotelBooking>('HotelBooking', HotelBookingSchema);