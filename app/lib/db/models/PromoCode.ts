import mongoose, { Document } from 'mongoose';
import promoCodeSchema from '../schema/promoCodes';

// Optional: define an interface if you want type safety
export interface IPromoCode extends Document {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  currency?: string;
  maxDiscount?: number;
  applicableTo?: any;
  conditions?: any;
  usageLimit?: number;
  usageCount?: number;
  userLimit?: number;
  isActive?: boolean;
  validFrom?: Date;
  validUntil?: Date;
}

export default mongoose.models.PromoCode || mongoose.model<IPromoCode>('PromoCode', promoCodeSchema);