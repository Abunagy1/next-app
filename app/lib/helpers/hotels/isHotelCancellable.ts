interface CancellableUntil {
  unit: 'days' | 'hours' | 'minutes' | 'seconds';
  value: number;
}

interface CancellationPolicy {
  cancellable: boolean;
  cancellableUntil: CancellableUntil;
}

export function isHotelCancellable(
  cancellationPolicy: CancellationPolicy | null | undefined,
  checkInDate: Date,
  bookingStatus: string
): boolean {
  // 🛡️ Guard against missing / nullish policies
  if (!cancellationPolicy || !cancellationPolicy.cancellable) return false;
  // if (bookingStatus !== 'confirmed' && bookingStatus !== 'pending') return false;
  // This helper is now only called for confirmed bookings.
  // Pending bookings are handled directly by the action.
  // Only confirmed bookings need the detailed check
  if (bookingStatus !== 'confirmed') return false;
  const until = cancellationPolicy.cancellableUntil;
  if (!until) return false;   // if no time restriction, fallback to cancellable
  let cancellableUntilMs = 0;
  switch (until.unit) {
    case 'days':
      cancellableUntilMs = until.value * 24 * 60 * 60 * 1000;
      break;
    case 'hours':
      cancellableUntilMs = until.value * 60 * 60 * 1000;
      break;
    case 'minutes':
      cancellableUntilMs = until.value * 60 * 1000;
      break;
    case 'seconds':
      cancellableUntilMs = until.value * 1000;
      break;
  }
  const lastTimeToCancel = new Date(checkInDate).getTime() + cancellableUntilMs;
  return lastTimeToCancel > Date.now();
}