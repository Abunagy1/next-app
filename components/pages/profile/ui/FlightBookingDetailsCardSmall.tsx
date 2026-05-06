"use client";

import { cn } from '@/app/lib/utils';
import {
  ArrowRight,
  Download,
  HandCoins,
  SquareArrowOutUpRight,
  View,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import NoSSR from '@/components/helpers/NoSSR';
import ShowTimeInClientSide from '@/components/helpers/ShowTimeInClientSide';
import { allowedFlightBookingActionBtns } from '@/app/lib/helpers/flights/allowedFlightBookingActionBtns';
import {
  BOOKING_STATUS_BG_COL_TW_CLASS,
  BOOKING_STATUS_TEXT_COL_TW_CLASS,
  PAYMENT_STATUS_BG_TW_CLASS,
  PAYMENT_STATUS_TEXT_COL_TW_CLASS,
} from '@/app/lib/constants';
import cancelFlightBookingAction from '@/app/lib/actions/cancelFlightBookingAction';
import { deleteFlightBookingAction } from '@/app/lib/actions/deleteFlightBookingAction';
import { toast } from 'sonner';

interface Passenger {
  key: string;
  fullName: string;
  passengerType: string;
  seatNumber?: string;
  seatClass?: string;
}

interface Segment {
  key: string;
  flightNumber: string;
  airplaneModelName: string;
  airlineName: string;
  airlineIataCode: string;
  departureDateTime: string | Date;
  departureAirportIataCode: string;
  departureAirportName: string;
  arrivalDateTime: string | Date;
  arrivalAirportIataCode: string;
  arrivalAirportName: string;
  flightDurationMinutes: number;
  gate?: string;
  terminal?: string;
}

interface BookingDetails {
  key: string;
  bookingStatus: string;
  paymentStatus: string;
  cancellationPolicy: any;
  bookedAt: string;
  itineraryFlightNumber: string;
  pnrCode: string;
  passengers: Passenger[];
  segments: Segment[];
}

interface FlightBookingDetailsCardSmallProps {
  className?: string;
  bookingDetails: BookingDetails;
}

export default function FlightBookingDetailsCardSmall({
  className,
  bookingDetails,
}: FlightBookingDetailsCardSmallProps) {
  const {
    key,
    bookingStatus,
    paymentStatus,
    cancellationPolicy,
    bookedAt,
    itineraryFlightNumber,
    pnrCode,
    passengers,
    segments,
  } = bookingDetails;

  const departureValue = segments[0]?.departureDateTime;
  const departureDate = departureValue ? new Date(departureValue) : new Date();

  const { canPay, canDownload, canCancel, canDelete } =
    allowedFlightBookingActionBtns(
      bookingStatus,
      paymentStatus,
      cancellationPolicy,
      departureDate,
    );

  return (
    <div
      className={cn(
        'w-full space-y-2 rounded-xl border bg-white p-4 shadow-sm transition-colors', // removed max-w and mx-auto
        'dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      {/* Top: Airline and Status */}
      <div className="flex items-start justify-between">
        <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-bold">
            <span className="font-medium">Booked At:</span>{' '}
            <NoSSR fallback="dd MMMM yyyy, hh:mm:ss a">
              <ShowTimeInClientSide date={bookedAt} formatStr="dd MMMM yyyy, hh:mm:ss a" />
            </NoSSR>
          </p>
          <p className="font-bold">
            <span className="font-medium">Flight No:</span>{' '}
            {itineraryFlightNumber}
          </p>
          <p className="font-bold">
            <span className="font-medium">PNR:</span> {pnrCode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="space-y-1">
            <p>
              <span className="sr-only">Booking Status: </span>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold capitalize',
                  BOOKING_STATUS_BG_COL_TW_CLASS[bookingStatus as keyof typeof BOOKING_STATUS_BG_COL_TW_CLASS],
                  BOOKING_STATUS_TEXT_COL_TW_CLASS[bookingStatus as keyof typeof BOOKING_STATUS_TEXT_COL_TW_CLASS],
                )}
              >
                {bookingStatus}
              </span>
            </p>
            <p>
              <span className="sr-only">Payment Status: </span>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold capitalize',
                  PAYMENT_STATUS_BG_TW_CLASS[paymentStatus as keyof typeof PAYMENT_STATUS_BG_TW_CLASS],
                  PAYMENT_STATUS_TEXT_COL_TW_CLASS[paymentStatus as keyof typeof PAYMENT_STATUS_TEXT_COL_TW_CLASS],
                )}
              >
                {paymentStatus}
              </span>
            </p>
          </div>
          <Link
            title="View Flight Details"
            href={`/user/my_bookings/flights/${key}`}
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            target="_blank"
          >
            <SquareArrowOutUpRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </Link>
        </div>
      </div>

      {/* Booking Details */}
      {segments.map((s) => (
        <div key={s.key} className="space-y-2 rounded-md border p-2 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{s.airlineName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.airlineIataCode}</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{s.flightNumber}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{s.airplaneModelName}</p>
            </div>
          </div>

          {/* Route Summary */}
          <div className="flex items-center justify-between text-2xl font-bold text-gray-800 dark:text-white">
            <span>{s.departureAirportIataCode}</span>
            <ArrowRight className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <span>{s.arrivalAirportIataCode}</span>
          </div>

          {/* Departure and Arrival Times */}
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p className="font-bold">
              <span className="font-medium">Departure:</span>{' '}
              <NoSSR fallback="dd MMMM yyyy, hh:mm a">
                <ShowTimeInClientSide date={s.departureDateTime} formatStr="dd MMMM yyyy, hh:mm a" />
              </NoSSR>
            </p>
            <p className="font-bold">
              <span className="font-medium">Arrival:</span>{' '}
              <NoSSR fallback="dd MMMM yyyy, hh:mm a">
                <ShowTimeInClientSide date={s.arrivalDateTime} formatStr="dd MMMM yyyy, hh:mm a" />
              </NoSSR>
            </p>
          </div>
        </div>
      ))}

      {/* Footer Action Buttons */}
      <div className="flex items-center gap-2">
        <Button title="View Booking" asChild size="sm" className="text-wrap">
          <Link title="View Booking" href={`/user/my_bookings/flights/${key}`}>
            <View className="mr h-4 w-4" />
          </Link>
        </Button>
        {canPay && (
          <Button title="Pay Now" size="sm" asChild>
            <Link href={`/user/my_bookings/flights/${key}/payment`}>
              <HandCoins className="h-4 w-4" />
            </Link>
          </Button>
        )}
        {canDownload && (
          <Button title="Download Ticket" asChild size="sm" className="text-wrap">
            <Link href={`/user/my_bookings/flights/${key}/ticket`}>
              <Download className="h-4 w-4" />
            </Link>
          </Button>
        )}
        {canCancel && (
          <Button
            title="Cancel Booking"
            size="sm"
            variant="destructive"
            onClick={async () => {
              const res = await cancelFlightBookingAction(pnrCode);
              if (res?.success) toast.success(res.message);
              else toast.error(res?.message || 'Cancellation failed');
            }}
          >
            Cancel
          </Button>
        )}
        {canDelete && (
          <Button
            title="Delete Booking"
            size="sm"
            variant="destructive"
            onClick={async () => {
              const res = await deleteFlightBookingAction(key);
              if (res?.success) toast.success(res.message);
              else toast.error(res?.message || 'Delete failed');
            }}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}