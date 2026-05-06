// app/lib/helpers/promoCode.ts
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { getOneDoc } from '@/app/lib/db/getOperationDB';

export interface PromoCodeValidationResult {
  valid: boolean;
  discountAmount?: number;         // in dollars
  discountType?: 'percentage' | 'fixed';
  message?: string;
  code?: string;
}

/**
 * Validates a promo code and returns the discount amount (in dollars).
 * @param totalBeforeDiscount – total price before any discount (for percentage calculation)
 */
export async function validateAndApplyPromoCode(
  code: string,
  totalBeforeDiscount: number
): Promise<PromoCodeValidationResult> {
  if (!code) return { valid: false };

  let promo: any;
  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT * FROM promo_codes
      WHERE code = ${code}
        AND is_active = true
        AND (valid_from IS NULL OR valid_from <= NOW())
        AND (valid_until IS NULL OR valid_until >= NOW())
        AND (usage_limit IS NULL OR usage_count < usage_limit)
    `;
    promo = rows[0] || null;
  } else {
    await connectDB();
    const promoDoc = await dataModels.PromoCode.findOne({
      code,
      isActive: true,
      $and: [
        { $or: [{ validFrom: null }, { validFrom: { $lte: new Date() } }] },
        { $or: [{ validUntil: null }, { validUntil: { $gte: new Date() } }] }
      ],
      $expr: { $lt: ['$usageCount', '$usageLimit'] } // only if usage_limit exists and count < limit
    }).lean();
    if (promoDoc) {
      promo = {
        code: promoDoc.code,
        discount_type: promoDoc.discountType,
        value: promoDoc.value,
        max_discount: promoDoc.maxDiscount,
        currency: promoDoc.currency || 'USD',
        usage_limit: promoDoc.usageLimit,
        usage_count: promoDoc.usageCount,
      };
    }
  }

  if (!promo) return { valid: false, message: 'Invalid or expired promo code' };

  let discountAmount = 0;
  const rawValue = Number(promo.value);
  if (promo.discount_type === 'percentage') {
    discountAmount = (totalBeforeDiscount * rawValue) / 100;
    if (promo.max_discount && discountAmount > Number(promo.max_discount)) {
      discountAmount = Number(promo.max_discount);
    }
  } else if (promo.discount_type === 'fixed') {
    discountAmount = rawValue;
  }

  return {
    valid: true,
    discountAmount,
    discountType: promo.discount_type,
    code: promo.code,
  };
}

/**
 * Increment usage count after a successful booking.
 */
export async function incrementPromoCodeUsage(code: string) {
  if (!code) return;
  if (dbType === 'postgres') {
    await sql`
      UPDATE promo_codes
      SET usage_count = usage_count + 1
      WHERE code = ${code}
    `;
  } else {
    await connectDB();
    await dataModels.PromoCode.updateOne({ code }, { $inc: { usageCount: 1 } });
  }
}