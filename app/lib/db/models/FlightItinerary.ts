import mongoose, { Schema, Document } from 'mongoose';

export interface IFlightItinerary extends Document {
  flightCode: string;
  date: Date;
  carrierInCharge: string; // airline IATA code
  departureAirportId: string;
  arrivalAirportId: string;
  segmentIds: mongoose.Types.ObjectId[];
  totalDurationMinutes: number;
  layovers: Array<{ fromSegmentIndex: number; durationMinutes: number }>;
  baggageAllowance: any; // JSON
  status: 'scheduled' | 'delayed' | 'departed' | 'arrived' | 'cancelled';
  expireAt: Date;
}

const FlightItinerarySchema = new Schema<IFlightItinerary>({
  flightCode: { type: String, required: true },
  date: { type: Date, required: true },
  carrierInCharge: { type: String, required: true, ref: 'Airline' },
  departureAirportId: { type: String, required: true, ref: 'Airport' },
  arrivalAirportId: { type: String, required: true, ref: 'Airport' },
  segmentIds: [{ type: Schema.Types.ObjectId, ref: 'FlightSegment' }],
  totalDurationMinutes: { type: Number, required: true },
  layovers: [{ fromSegmentIndex: Number, durationMinutes: Number }],
  baggageAllowance: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['scheduled', 'delayed', 'departed', 'arrived', 'cancelled'], default: 'scheduled' },
  expireAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

export default mongoose.models.FlightItinerary || mongoose.model<IFlightItinerary>('FlightItinerary', FlightItinerarySchema);