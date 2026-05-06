interface RefundPolicy {
  refundable: boolean;
}

export function isHotelRefundable(
  refundPolicy: RefundPolicy,
  bookingStatus: string,
  paymentStatus: string
): boolean {
  if (!refundPolicy.refundable) return false;
  if (bookingStatus !== 'cancelled') return false;
  if (paymentStatus !== 'paid') return false;
  return true;
}