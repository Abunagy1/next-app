import mongoose, { Schema, Document } from 'mongoose';

export interface IHotelRoom extends Document {
  hotelId: mongoose.Types.ObjectId;
  description: string;
  roomType: string;
  features: string[];
  amenities: string[];
  images: string[];
  price: {
    base: number;
    tax: number;
    discount: {
      amount: number;
      type: 'percentage' | 'fixed';
      validUntil?: Date;
    };
    serviceFee: number;
    currency: string;
  };
  totalBeds: number;
  bedOptions: string;
  sleepsCount: number;
  smokingAllowed: boolean;
  maxAdults: number;
  maxChildren: number;
  extraBedAllowed: boolean;
  floor: number;
  roomNumber: string;
  tags: string[];
}

const HotelRoomSchema = new Schema<IHotelRoom>({
  hotelId: { type: Schema.Types.ObjectId, ref: 'Hotel', required: true },
  description: { type: String, required: true },
  roomType: String,
  features: [String],
  amenities: [String],
  images: [String],
  price: {
    base: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: {
      amount: { type: Number, default: 0 },
      type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
      validUntil: Date,
    },
    serviceFee: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
  },
  totalBeds: { type: Number, default: 1 },
  bedOptions: String,
  sleepsCount: Number,
  smokingAllowed: Boolean,
  maxAdults: Number,
  maxChildren: Number,
  extraBedAllowed: Boolean,
  floor: Number,
  roomNumber: String,
  tags: [String]
}, { timestamps: true });

export default mongoose.models.HotelRoom || mongoose.model<IHotelRoom>('HotelRoom', HotelRoomSchema);