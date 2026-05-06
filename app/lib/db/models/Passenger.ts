import mongoose, { Schema, Document } from 'mongoose';

export interface IPassenger extends Document {
  firstName: string;
  lastName: string;
  passengerType: 'adult' | 'child' | 'infant';
  email: string;
  phoneNumber: {
    number: string;
    dialCode: string;
  };
  dateOfBirth: Date;
  gender: 'male' | 'female';
  passportNumber: string;
  passportExpiryDate: Date;
  country: string;
  seatClass: 'economy' | 'premium_economy' | 'business' | 'first';
  frequentFlyerNumber?: string;
  frequentFlyerAirline?: string;
  preferences?: any;
  isPrimary: boolean;
}

const PassengerSchema = new Schema<IPassenger>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  passengerType: { type: String, enum: ['adult', 'child', 'infant'], required: true },
  email: { type: String, required: true },
  phoneNumber: {
    number: { type: String, required: true },
    dialCode: { type: String, required: true },
  },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['male', 'female'], required: true },
  passportNumber: { type: String, required: true },
  passportExpiryDate: { type: Date, required: true },
  country: { type: String, required: true },
  seatClass: { type: String, enum: ['economy', 'premium_economy', 'business', 'first'], required: true },
  frequentFlyerNumber: String,
  frequentFlyerAirline: String,
  preferences: { type: Schema.Types.Mixed },
  isPrimary: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Passenger || mongoose.model<IPassenger>('Passenger', PassengerSchema);