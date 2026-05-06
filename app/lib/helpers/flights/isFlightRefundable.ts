interface BookingInfo {
  departureTime: Date;
  paymentStatus: string;
  bookingStatus: string;
  fareType: string;
  createdAt?: Date;
}

interface CancellationPolicy {
  gracePeriodHours?: number;
  allowVoucherInsteadOfRefund?: boolean;
  fareRules?: Record<string, { cancellable: boolean; refundType?: 'full' | 'partial' | 'voucher' | null }>;
}

export default function isFlightRefundable(
  booking: BookingInfo,
  cancellationPolicy: CancellationPolicy
): boolean {
  // If policy is missing or invalid, assume not refundable
  if (!cancellationPolicy || typeof cancellationPolicy !== 'object') {
    return false;
  }
  const now = new Date();
  if (
    now >= new Date(booking.departureTime) ||
    (booking.paymentStatus !== 'paid' && booking.bookingStatus !== 'confirmed')
  ) {
    return false;
  }
  const policy = cancellationPolicy;
  const fareRule = policy.fareRules?.[booking.fareType];
  if (!fareRule || !fareRule.cancellable) {
    const hoursSinceBooking =
      (now.getTime() - (booking.createdAt?.getTime() || now.getTime())) / (1000 * 60 * 60);
    if (policy.gracePeriodHours && hoursSinceBooking <= policy.gracePeriodHours) {
      return true;
    }
    return false;
  }
  if (fareRule.refundType === 'full' || fareRule.refundType === 'partial') {
    return true;
  }
  if (fareRule.refundType === 'voucher' && policy.allowVoucherInsteadOfRefund) {
    return true;
  }
  return false;
}