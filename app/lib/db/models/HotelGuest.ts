import mongoose, { Schema, Document } from 'mongoose';

export interface IHotelGuest extends Document {
  userId: mongoose.Types.ObjectId;
  hotelBookingId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  guestType: 'adult' | 'child' | 'infant';
  age?: number;
  isPrimary: boolean;
}

const HotelGuestSchema = new Schema<IHotelGuest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  hotelBookingId: { type: Schema.Types.ObjectId, ref: 'HotelBooking', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: String,
  phone: String,
  guestType: { type: String, enum: ['adult', 'child', 'infant'], default: 'adult' },
  age: Number,
  isPrimary: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.HotelGuest || mongoose.model<IHotelGuest>('HotelGuest', HotelGuestSchema);