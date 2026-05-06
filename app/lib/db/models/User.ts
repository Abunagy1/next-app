// app/lib/db/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  // Existing fields
  name: string;
  email: string;
  password: string;
  email_verified: boolean;
  image?: string;
  phone?: string;
  city?: string;
  about?: string;
  birth_date?: Date; //   dateOfBirth?: Date;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;

  // New fields from old project
  firstName?: string;
  lastName?: string;
  coverImage?: string;
  phoneNumbers?: Array<{
    number: string;
    dialCode: string;
    primary: boolean;
    verifiedAt?: Date;
    inVerification?: boolean;
  }>;
  emails?: Array<{
    email: string;
    emailVerifiedAt?: Date;
    primary: boolean;
    inVerification?: boolean;
  }>;
  address?: string;
  customerId?: string;
  flightBookmarks?: Array<{ flightId: mongoose.Types.ObjectId; searchState: any }>;
  hotelBookmarks?: mongoose.Types.ObjectId[];
  rewardPoints?: {
    totalPoints: number;
    pointHistory: any[];
  };
}

const UserSchema = new Schema<IUser>({
  // Existing fields
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email_verified: { type: Boolean, default: false },
  image: { type: String },
  phone: { type: String },
  city: { type: String },
  about: { type: String },
  birth_date: { type: Date, default: null }, //   dateOfBirth: { type: Date, default: null },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },

  // New fields
  firstName: { type: String },
  lastName: { type: String },
  coverImage: { type: String },
  phoneNumbers: [{ type: Schema.Types.Mixed }],
  emails: [{ type: Schema.Types.Mixed }],
  address: { type: String },
  customerId: { type: String },
  flightBookmarks: [{
    flightId: { type: Schema.Types.ObjectId, ref: 'FlightItinerary' },
    searchState: { type: Schema.Types.Mixed }
  }],
  hotelBookmarks: [{ type: Schema.Types.ObjectId, ref: 'Hotel' }],
  rewardPoints: { type: Schema.Types.Mixed }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);