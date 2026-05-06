import mongoose, { Schema, Document } from 'mongoose';
export interface IReservation extends Document {
  name: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  image?: string;
  images: string[];
  amenities: string[];
  stars: number;
}
const HotelSchema = new Schema<IReservation>({
  name: { type: String, required: true },
  description: String,
  address: String,
  city: String,
  country: String,
  image: String,
  images: [String],
  amenities: [String],
  stars: Number,
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});
export default mongoose.models.Hotel || mongoose.model<IReservation>('Hotel', HotelSchema);