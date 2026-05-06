import mongoose, { Schema, Document } from 'mongoose';

export interface IAirline extends Document {
  iataCode: string;
  name: string;
  logo?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  airlinePolicy?: any; // JSON
}

const AirlineSchema = new Schema<IAirline>({
  iataCode: { type: String },
  name: { type: String, required: true },
  logo: { type: String },
  contact: {
    phone: String,
    email: String,
    website: String,
  },
  airlinePolicy: { type: Schema.Types.Mixed }
}, { timestamps: true });

export default mongoose.models.Airline || mongoose.model<IAirline>('Airline', AirlineSchema);