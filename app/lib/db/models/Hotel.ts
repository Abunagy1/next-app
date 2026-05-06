import mongoose, { Schema, Document } from 'mongoose';

export interface IHotel extends Document {
  slug: string;
  name: string;
  description: string;
  category: string;
  parkingIncluded?: boolean;
  lastRenovationDate?: Date;
  isDeleted?: boolean;
  address: {
    streetAddress: string;
    city: string;
    stateProvince: string;
    postalCode: string;
    country: string;
  };
  coordinates: {
    lat: number;
    lon: number;
  };
  amenities: string[];
  features: string[];
  images: string[];
  status: 'Opened' | 'Closed';
  totalRooms: number;
  rooms: mongoose.Types.ObjectId[];
  tags: string[];
  policies: any; // JSON
}

const HotelSchema = new Schema<IHotel>({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: String,
  parkingIncluded: Boolean,
  lastRenovationDate: Date,
  isDeleted: Boolean,
  address: {
    streetAddress: String,
    city: String,
    stateProvince: String,
    postalCode: String,
    country: String,
  },
  coordinates: {
    lat: Number,
    lon: Number,
  },
  amenities: [String],
  features: [String],
  images: [String],
  status: { type: String, enum: ['Opened', 'Closed'], default: 'Opened' },
  totalRooms: { type: Number, required: true },
  rooms: [{ type: Schema.Types.ObjectId, ref: 'HotelRoom' }],
  tags: [String],
  policies: { type: Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.models.Hotel || mongoose.model<IHotel>('Hotel', HotelSchema);