import mongoose, { Schema, Document } from 'mongoose';
export interface IRevenue extends Document {
  month: string;
  revenue: number;
}
const RevenueSchema = new Schema<IRevenue>({
  month: { type: String, required: true, unique: true },
  revenue: { type: Number, required: true }
});
export default mongoose.models.Revenue || mongoose.model<IRevenue>('Revenue', RevenueSchema);