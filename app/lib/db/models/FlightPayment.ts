import mongoose, { Schema, Document } from 'mongoose';

export interface IFlightPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  transactionId: string;
  stripe_paymentIntentId: string;
  stripe_chargeId: string;
  paymentMethod: {
    id: string;
    methodType: string;
    brand: string;
    last4: string;
  };
  amount: number;
  paymentDate: number;
  receiptUrl: string;
}

const FlightPaymentSchema = new Schema<IFlightPayment>({
  bookingId: { type: Schema.Types.ObjectId, ref: 'FlightBooking' },
  transactionId: { type: String, required: true },
  stripe_paymentIntentId: { type: String, required: true },
  stripe_chargeId: { type: String, required: true },
  paymentMethod: {
    id: String,
    methodType: String,
    brand: String,
    last4: String,
  },
  amount: { type: Number, required: true },
  paymentDate: { type: Number, required: true },
  receiptUrl: { type: String, required: true }
}, { timestamps: true });

export default mongoose.models.FlightPayment || mongoose.model<IFlightPayment>('FlightPayment', FlightPaymentSchema);