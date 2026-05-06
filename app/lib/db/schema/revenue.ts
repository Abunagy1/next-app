import { Schema } from 'mongoose';

export interface IRevenue {
  month: string;
  revenue: number;
}

const revenueSchema = new Schema<IRevenue>({
  month: { type: String, required: true, unique: true },
  revenue: { type: Number, required: true },
});

export default revenueSchema;