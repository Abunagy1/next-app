import mongoose, { Schema, Document } from 'mongoose';

export interface IFlightSegment extends Document {
  flightNumber: string;
  date: Date;
  airlineId: string;
  airplaneId: mongoose.Types.ObjectId;
  from: {
    airport: string;
    scheduledDeparture: Date;
    terminal: string;
    gate: string;
  };
  to: {
    airport: string;
    scheduledArrival: Date;
    terminal: string;
    gate: string;
  };
  durationMinutes: number;
  seats: mongoose.Types.ObjectId[];
  fareDetails: any; // JSON
  baggageAllowance: any;
  status: string;
  expireAt: Date;
}

const FlightSegmentSchema = new Schema<IFlightSegment>({
  flightNumber: { type: String, required: true },
  date: { type: Date, required: true },
  airlineId: { type: String, ref: 'Airline', required: true },
  airplaneId: { type: Schema.Types.ObjectId, ref: 'Airplane', required: true },
  from: {
    airport: { type: String, ref: 'Airport', required: true },
    scheduledDeparture: { type: Date, required: true },
    terminal: String,
    gate: String,
  },
  to: {
    airport: { type: String, ref: 'Airport', required: true },
    scheduledArrival: { type: Date, required: true },
    terminal: String,
    gate: String,
  },
  durationMinutes: { type: Number, required: true },
  seats: [{ type: Schema.Types.ObjectId, ref: 'FlightSeat', required: true }],
  fareDetails: { type: Schema.Types.Mixed, required: true },
  baggageAllowance: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['scheduled', 'delayed', 'departed', 'arrived', 'cancelled'], default: 'scheduled' },
  expireAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

export default mongoose.models.FlightSegment || mongoose.model<IFlightSegment>('FlightSegment', FlightSegmentSchema);