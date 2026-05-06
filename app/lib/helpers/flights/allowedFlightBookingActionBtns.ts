import isFlightCancellable from './isFlightCancellable';
import isFlightRefundable from './isFlightRefundable';

export function allowedFlightBookingActionBtns(
  bookingStatus: string,
  paymentStatus: string,
  cancellationPolicy: any,
  departureDate: Date,
  fareType: string = 'refundable'
) {
  const cancelled = bookingStatus === 'cancelled';
  const confirmed = bookingStatus === 'confirmed';
  const pending = bookingStatus === 'pending';
  const paid = paymentStatus === 'paid';
  const payFailed = paymentStatus === 'failed';
  const payPending = paymentStatus === 'pending';
  const isFlightExpired = new Date(departureDate) < new Date();
  const policyExists = cancellationPolicy && typeof cancellationPolicy === 'object' || {};
  return {
    canConfirm: !cancelled && !confirmed && !pending,
    // if you want a strict cancelation requires the booking to be both paid and confirmed use following
    // canCancel: isFlightCancellable(
    //   {
    //     departureTime: departureDate,
    //     paymentStatus: paymentStatus,
    //     bookingStatus: bookingStatus,
    //     fareType: fareType,
    //   },
    //   cancellationPolicy
    // ),
    // for a pending (not yet paid) booking if you want to cancel theme use the following 
    // canCancel: !cancelled && (confirmed || pending) && new Date(departureDate) > new Date(),
    canCancel:
      !cancelled &&
      (pending && new Date(departureDate) > new Date()) ||
      (confirmed &&
        policyExists &&
        isFlightCancellable({ departureTime: departureDate, paymentStatus, bookingStatus, fareType }, cancellationPolicy)),
    canRefund: policyExists
      ? isFlightRefundable(
      {
        departureTime: departureDate,
        paymentStatus: paymentStatus,
        bookingStatus: bookingStatus,
        fareType: fareType,
      },
      cancellationPolicy
    ): false,
    canDownload: confirmed && paid,
    canDelete: cancelled,
    canPay:
      !cancelled &&
      (confirmed || pending) &&
      (payPending || payFailed) &&
      !paid &&
      !isFlightExpired,
  };
}