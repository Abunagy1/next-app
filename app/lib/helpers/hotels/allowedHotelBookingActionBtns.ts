import { isHotelCancellable } from './isHotelCancellable';
import { isHotelRefundable } from './isHotelRefundable';

export function allowedHotelBookingActionBtns(
  bookingStatus: string,
  paymentStatus: string,
  cancellationPolicy: any,
  refundPolicy: any,
  checkInDate: Date,
  paymentMethod?: string   // ← new optional parameter
) {
  const safeCancellationPolicy = cancellationPolicy ?? { cancellable: false };
  const cancelled = bookingStatus === 'cancelled';
  const confirmed = bookingStatus === 'confirmed';
  const pending = bookingStatus === 'pending';
  const paid = paymentStatus === 'paid';
  const payFailed = paymentStatus === 'failed';
  const payPending = paymentStatus === 'pending';

  return {
    canConfirm: !cancelled && !confirmed && !pending,
    // canCancel: isHotelCancellable(cancellationPolicy, checkInDate, bookingStatus),
    canCancel:
      !cancelled &&
      (pending && new Date(checkInDate) > new Date()) ||
      (confirmed &&
        (paymentStatus === 'pending' && paymentMethod === 'cash' && new Date(checkInDate) > new Date()) ||   // ← allow cancel if not paid and not past check‑in
            isHotelCancellable(safeCancellationPolicy, checkInDate, bookingStatus)),
    canRefund: isHotelRefundable(refundPolicy, bookingStatus, paymentStatus),
    canDownload: confirmed && paid,
    canDelete: cancelled,
    canPay:
      !cancelled &&
      (confirmed || pending) &&
      (payPending || payFailed) &&
      !paid,
  };
}