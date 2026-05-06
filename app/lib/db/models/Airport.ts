import mongoose, { Schema, Document } from 'mongoose';

export interface IAirport extends Document {
  iataCode: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  facilities: string[];
  image?: string;
}

const AirportSchema = new Schema<IAirport>({
  iataCode: { type: String },
  name: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  country: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  timezone: { type: String, required: true },
  facilities: [String],
  image: String
}, { timestamps: true });

export default mongoose.models.Airport || mongoose.model<IAirport>('Airport', AirportSchema);