import mongoose, { Schema, Document } from 'mongoose';

export interface IFlightSeat extends Document {
  seatNumber: string;
  airplaneId: mongoose.Types.ObjectId;
  segmentId: mongoose.Types.ObjectId;
  class: 'economy' | 'premium_economy' | 'business' | 'first';
  reservation: {
    pnrCode?: string;
    for?: mongoose.Types.ObjectId;
    type?: 'temporary' | 'permanent';
    expiresAt?: number;
  };
  expireAt: Date;
}

const FlightSeatSchema = new Schema<IFlightSeat>({
  seatNumber: { type: String, required: true },
  airplaneId: { type: Schema.Types.ObjectId, ref: 'Airplane', required: true },
  segmentId: { type: Schema.Types.ObjectId, ref: 'FlightSegment', required: true },
  class: { type: String, enum: ['economy', 'premium_economy', 'business', 'first'], required: true },
  reservation: {
    pnrCode: String,
    for: { type: Schema.Types.ObjectId, ref: 'Passenger' },
    type: { type: String, enum: ['temporary', 'permanent'] },
    expiresAt: Number,
  },
  expireAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

export default mongoose.models.FlightSeat || mongoose.model<IFlightSeat>('FlightSeat', FlightSeatSchema);