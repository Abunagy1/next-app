// app/lib/db/models/Airplane.ts
import mongoose, { Schema } from 'mongoose';

export interface IAirplane extends Omit<mongoose.Document, 'model'> {
  airline_id: string;          // references Airline.iata_code
  model: string;               // aircraft model (e.g., "Boeing 737")
  cruise_speed: {
    speedIn: string;           // e.g., "mi"
    per: string;               // e.g., "hour"
    value: number;
  };
  classes: string[];           // e.g., ["economy", "business"]
  images: string[];
  total_seats: number;
  facilities?: string[];
}

const AirplaneSchema = new Schema<IAirplane>(
  {
    airline_id: { type: String, ref: 'Airline', required: true },
    model: { type: String, required: true },
    cruise_speed: {
      speedIn: { type: String, required: true },
      per: { type: String, required: true },
      value: { type: Number, required: true },
    },
    classes: [{ type: String }],
    images: [{ type: String }],
    total_seats: { type: Number, required: true },
    facilities: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.models.Airplane || mongoose.model<IAirplane>('Airplane', AirplaneSchema);