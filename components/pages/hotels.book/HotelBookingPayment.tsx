'use client';
import Countdown from '@/components/local-ui/Countdown';
import { AlertTriangle, ClockIcon } from 'lucide-react';
import MakePaymentSection from '@/components/sections/MakePaymentSection';
import useFetch from '@/app/lib/hooks/useFetch';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { confirmHotelBookingCashAction } from '@/app/lib/actions/confirmHotelBookingAction';

interface HotelBookingPaymentProps {
  slug: string;
  checkInDate: string | number;
  checkOutDate: string | number;
}

export default function HotelBookingPayment({ slug, checkInDate, checkOutDate }: HotelBookingPaymentProps) {
  const router = useRouter();
  const [paymentMethodType, setPaymentMethodType] = useState('cash');

  const {
    data: hotelBookingData,
    loading: hotelBookingLoading,
    error: hotelBookingError,
    retry: hotelBookingRetry,
  } = useFetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/get_reserved_hotel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, checkInDate, checkOutDate }),
  });
  console.log('🔍 hotelBookingData raw:', hotelBookingData);
  const { data, loading, error, retry } = useFetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/create_hotel_booking_payment_intent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, checkInDate, checkOutDate }),
    }
  );

  async function middleware(next = async () => {}) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/user/get_reserved_hotel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, checkInDate, checkOutDate }),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch booking details');
      }
      const data = await res.json();
      if (data.success === false) {
        throw new Error(data.message);
      }
      await next();
    } catch (e: any) {
      console.log(e);
      toast.error(e.message || 'Failed confirming payment');
    }
  }

  // ── Helper: get a usable booking ID regardless of DB ──
  const getBookingId = (): string | null => {
    const booking = hotelBookingData?.data;
    console.log('🔍 getBookingId – booking:', booking);
    if (!booking) return null;
    return booking.id || booking._id || null;
  };
  function onSuccessCard() {
    const bookingId = getBookingId();
    if (!bookingId) {
      toast.error('Booking ID missing');
      return;
    }
    toast.success('Payment successful! Redirecting...');
    setTimeout(() => {
      const searchParams = new URLSearchParams({
        title: 'Payment successful',
        message: 'Your payment was successful',
        callbackUrl: `/user/my_bookings/hotels/${bookingId}/invoice`,
        callbackTitle: 'Download Invoice',
      });
      router.push(`/success?${searchParams.toString()}`);
    }, 2000);
  }
  function onSuccessCash() {
    const bookingId = getBookingId();
    if (!bookingId) {
      toast.error('Booking ID missing');
      return;
    }
    toast.success('Booking confirmed! Redirecting...');
    setTimeout(() => {
      const searchParams = new URLSearchParams({
        title: 'Booking confirmed',
        message: 'Your booking was confirmed. You can pay on property or now',
        callbackUrl: `/user/my_bookings/hotels/${bookingId}`,
        callbackTitle: 'View booking',
      });
      router.push(`/success?${searchParams.toString()}`);
    }, 2000);
  }

  return hotelBookingError ? (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-6 rounded-md border border-red-300 bg-red-50 p-6 shadow-sm dark:bg-gray-800 dark:text-gray-200">
      <div className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-6 w-6" />
        <h2 className="text-xl font-semibold">Failed loading payment form</h2>
      </div>
      <p className="max-w-xl text-center text-sm text-red-700">
        {hotelBookingError || 'Something went wrong. Please try again.'}
      </p>
      {hotelBookingError !== 'No reserved hotel booking found' && (
        <Button onClick={hotelBookingRetry} variant="destructive">
          Try Again
        </Button>
      )}
    </div>
  ) : (
    <>
      <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4 shadow-md dark:bg-yellow-900/20 dark:border-yellow-800">
        <p className="text-sm text-gray-800 dark:text-gray-200">
          Your booking has been reserved and will be held for a limited time. Please confirm the booking within the
          limit whether by selecting cash payment on the property or by making a payment using card. After the
          reservation is expired, there is no guarantee that one of the rooms in your booking will be reserved and
          may be taken by someone else.
        </p>
        <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-yellow-800 dark:text-yellow-500">
          <ClockIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
          Guaranteed reservation until:{' '}
          {!hotelBookingLoading ? (
            <Countdown className="dark:text-yellow-500"
              currentTimeMs={Date.now()}
              timeoutAtMs={new Date(hotelBookingData?.data?.guaranteedReservationUntil)?.getTime() || 0}
            />
          ) : (
            <Skeleton className="h-4 w-20" />
          )}
        </div>
      </div>
      <div className="mb-[20px] rounded-[12px] bg-white p-[16px] shadow-md lg:mb-[30px] xl:mb-[40px] dark:bg-gray-800">
        <RadioGroup onValueChange={setPaymentMethodType} defaultValue="cash">
          <Label className="flex grow items-center justify-between gap-[32px] rounded-[12px] p-[16px] has-[[data-state='checked']]:bg-primary dark:has-[[data-state='checked']]:bg-primary/80">
            <div>
              <p className="mb-2 font-bold dark:text-white">Pay in Property</p>
              <p className="text-[0.875rem] dark:text-gray-400">Pay at the property when you check-in.</p>
            </div>
            <RadioGroupItem
              className="border-2 data-[state='checked']:border-white data-[state='checked']:text-white dark:border-gray-500"
              value="cash"
            />
          </Label>
          <Label className="flex grow items-center justify-between gap-[32px] rounded-[12px] p-[16px] has-[[data-state='checked']]:bg-primary dark:has-[[data-state='checked']]:bg-primary/80">
            <div>
              <p className="mb-2 font-bold dark:text-white">Pay now</p>
              <p className="text-[0.875rem] dark:text-gray-400">Pay now and get your room reserved.</p>
            </div>
            <RadioGroupItem
              className="border-2 data-[state='checked']:border-white data-[state='checked']:text-white dark:border-gray-500"
              value="card"
            />
          </Label>
        </RadioGroup>
      </div>
      <div className="flex justify-center rounded-[12px] bg-white p-[16px] shadow-md lg:mb-[30px] xl:mb-[40px] dark:bg-gray-800">
        {paymentMethodType === 'card' && (
          <MakePaymentSection
            className="w-full shadow-none"
            onSuccess={onSuccessCard}
            middleware={middleware}
            loading={loading}
            error={error}
            retry={retry}
            paymentIntents={data?.data?.paymentIntents}
            paymentStatus={data?.data?.paymentStatus}
          />
        )}
        {paymentMethodType === 'cash' && (
          <Button
            onClick={async (e) => {
              const button = e.currentTarget as HTMLButtonElement;
              button.disabled = true;
              const cashBookingId = getBookingId();
              if (!cashBookingId) {
                toast.error('Booking ID missing');
                button.disabled = false;
                return;
              }
              const { success, message } = await confirmHotelBookingCashAction(cashBookingId);
              if (!success) {
                toast.error(message || 'Failed to confirm booking');
              }
              if (success) {
                onSuccessCash();
              }
              button.disabled = false;
            }}
            variant="default"
            disabled={loading}
            className="w-[200px] text-center"
          >
            Pay Later
          </Button>
        )}
      </div>
    </>
  );
}