interface BookingInfo {
  departureTime: Date;
  paymentStatus: string;
  bookingStatus: string;
  fareType: string;
  createdAt?: Date;
}

interface CancellationPolicy {
  gracePeriodHours?: number;
  cutoffHoursBeforeDeparture?: number;
  fareRules?: Record<string, { cancellable: boolean }>;
}

export default function isFlightCancellable(
  booking: BookingInfo,
  cancellationPolicy: CancellationPolicy | null | undefined,
): boolean {
  // If policy is missing or invalid, assume not cancellable
  if (!cancellationPolicy || typeof cancellationPolicy !== 'object') {
    return false;
  }
  const now = new Date();
  // Can't cancel if already cancelled or flight has already departed
  if (booking.bookingStatus === 'cancelled' || now >= new Date(booking.departureTime)) {
    return false;
  }
  // Pending bookings can always be cancelled (no payment yet)
  if (booking.bookingStatus === 'pending' && booking.paymentStatus === 'pending') {
    return true;
  }
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
  if (policy.cutoffHoursBeforeDeparture) {
    const cutoffTime = new Date(booking.departureTime);
    cutoffTime.setHours(cutoffTime.getHours() - policy.cutoffHoursBeforeDeparture);
    if (now > cutoffTime) {
      return false;
    }
  }
  return true;
}

// function isFlightCancellable(
//   booking: {
//     paymentStatus: string;
//     ticketStatus: string;
//     departureTime: Date;
//     fareType: string;
//     createdAt?: Date;
//   },
//   cancellationPolicy: any
// ): boolean {
//   const now = new Date();
//   if (
//     now >= new Date(booking.departureTime) ||
//     (booking.paymentStatus !== 'paid' && booking.ticketStatus !== 'confirmed')
//   ) {
//     return false;
//   }
//   const policy = cancellationPolicy;
//   const fareRule = policy.fareRules?.[booking.fareType];
//   if (!fareRule || !fareRule.cancellable) {
//     const hoursSinceBooking =
//       (now.getTime() - (booking.createdAt?.getTime() || now.getTime())) / (1000 * 60 * 60);
//     if (policy.gracePeriodHours && hoursSinceBooking <= policy.gracePeriodHours) {
//       return true;
//     }
//     return false;
//   }
//   if (policy.cutoffHoursBeforeDeparture) {
//     const cutoffTime = new Date(booking.departureTime);
//     cutoffTime.setHours(cutoffTime.getHours() - policy.cutoffHoursBeforeDeparture);
//     if (now > cutoffTime) {
//       return false;
//     }
//   }
//   return true;
// }