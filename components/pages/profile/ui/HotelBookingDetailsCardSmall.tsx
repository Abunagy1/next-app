'use client';
import { cn, currencyFormat } from '@/app/lib/utils';
import { SmallDataCard } from '@/components/pages/profile/ui/SmallDataCard';
import timer from '@/public/travel/icons/timer-mint.svg';
import Link from 'next/link';
import { Download, HandCoins, SquareArrowOutUpRight, View } from 'lucide-react';
import NoSSR from '@/components/helpers/NoSSR';
import ShowTimeInClientSide from '@/components/helpers/ShowTimeInClientSide';
import locationIcon from '@/public/travel/icons/location.svg';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  BOOKING_STATUS_BG_COL_TW_CLASS,
  BOOKING_STATUS_TEXT_COL_TW_CLASS,
  PAYMENT_STATUS_BG_TW_CLASS,
  PAYMENT_STATUS_TEXT_COL_TW_CLASS,
} from '@/app/lib/constants';
import { parseHotelCheckInOutPolicy } from '@/app/lib/helpers/hotels';
import { allowedHotelBookingActionBtns } from '@/app/lib/helpers/hotels/allowedHotelBookingActionBtns';
import { DirectDownloadHotelInvoiceButton } from './DirectDownloadHotelInvoiceButton';
import { CancelHotelBookingButton } from '../../hotels.[bookingId]/ActionsButtons';
import { deleteHotelBookingAction } from '@/app/lib/actions/deleteHotelBookingAction';
import { toast } from 'sonner';

interface Room {
  _id: string;
  floor: number;
  roomNumber: string;
  roomType: string;
  sleepsCount: number;
  bedOptions: string;
}

interface HotelDetails {
  _id: string;
  name: string;
  address: { streetAddress: string; city: string; country: string };
  policies: { checkIn: string; checkOut: string; cancellationPolicy: any; refundPolicy: any };
  rooms: Room[];
}

interface BookingDetails {
  _id: string;
  checkInDate: string;
  checkOutDate: string;
  guests: any[];
  totalPrice: number;
  rooms: string[];
  bookingStatus: string;
  paymentStatus: string;
}

interface HotelBookingDetailsCardSmallProps {
  className?: string;
  hotelDetails: HotelDetails;
  bookingDetails: BookingDetails;
}

export default function HotelBookingDetailsCardSmall({
  className,
  hotelDetails,
  bookingDetails,
}: HotelBookingDetailsCardSmallProps) {
  let checkIn = bookingDetails.checkInDate ? new Date(bookingDetails.checkInDate) : new Date();
  let checkOut = bookingDetails.checkOutDate ? new Date(bookingDetails.checkOutDate) : new Date();
  if (isNaN(checkIn.getTime())) checkIn = new Date();
  if (isNaN(checkOut.getTime())) checkOut = new Date();

  const hotelCheckInTime = parseHotelCheckInOutPolicy(hotelDetails.policies.checkIn);
  const hotelCheckOutTime = parseHotelCheckInOutPolicy(hotelDetails.policies.checkOut);
  checkIn.setHours(hotelCheckInTime.hour, hotelCheckInTime.minute, 0, 0);
  checkOut.setHours(hotelCheckOutTime.hour, hotelCheckOutTime.minute, 0, 0);

  let bookingRooms = bookingDetails.rooms;
  if (typeof bookingRooms === 'string') {
    try { bookingRooms = JSON.parse(bookingRooms); } catch { bookingRooms = []; }
  }
  if (!Array.isArray(bookingRooms)) bookingRooms = [];

  const safeTotalPrice = Number(bookingDetails.totalPrice) || 0;
  const data = {
    key: bookingDetails._id,
    hotelName: hotelDetails.name,
    address: hotelDetails.address,
    guestsCount: Array.isArray(bookingDetails.guests) ? bookingDetails.guests.length : 0,
    totalPrice: safeTotalPrice,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    cancellationPolicy: hotelDetails.policies.cancellationPolicy,
    refundPolicy: hotelDetails.policies.refundPolicy,
    rooms: (hotelDetails.rooms || []).filter((room) => bookingRooms.includes(room._id)).map((room) => ({
      _id: room._id,
      floor: room.floor,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      sleepsCount: room.sleepsCount,
      bedOptions: room.bedOptions,
    })),
    bookingStatus: bookingDetails.bookingStatus,
    paymentStatus: bookingDetails.paymentStatus,
  };

  const { canDownload, canPay, canCancel, canDelete } = allowedHotelBookingActionBtns(
    data.bookingStatus,
    data.paymentStatus,
    data.cancellationPolicy,
    data.refundPolicy,
    data.checkInDate,
  );

  const checkInDateElement = (
    <NoSSR fallback="EEE, MMM d, yyy">
      <ShowTimeInClientSide date={data.checkInDate || ''} formatStr="EEE, MMM d, yyy" />
    </NoSSR>
  );
  const checkOutDateElement = (
    <NoSSR fallback="EEE, MMM d, yyy">
      <ShowTimeInClientSide date={data.checkOutDate || ''} formatStr="EEE, MMM d, yyy" />
    </NoSSR>
  );
  const checkInTimeElement = (
    <NoSSR fallback="hh:mm aaa">
      <ShowTimeInClientSide date={data.checkInDate || ''} formatStr="hh:mm aaa" />
    </NoSSR>
  );
  const checkOutTimeElement = (
    <NoSSR fallback="hh:mm aaa">
      <ShowTimeInClientSide date={data.checkOutDate} formatStr="hh:mm aaa" />
    </NoSSR>
  );

  return (
    <div
      className={cn(
        'w-full space-y-4 rounded-xl border bg-white p-4 shadow-sm transition-colors', // removed max-w and mx-auto
        'dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h2 className="text-lg font-semibold dark:text-white">{data.hotelName}</h2>
          <div className="flex flex-wrap items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
            <Image src={locationIcon} alt="location_icon" height={16} width={16} />
            <p className="whitespace-pre-wrap break-words">
              {data.address.streetAddress}, {data.address.city},{' '}
              {data.address.country}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start">
          <div className="space-y-1">
            <p>
              <span className="sr-only">Booking Status: </span>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold capitalize',
                  BOOKING_STATUS_BG_COL_TW_CLASS[data.bookingStatus as keyof typeof BOOKING_STATUS_BG_COL_TW_CLASS],
                  BOOKING_STATUS_TEXT_COL_TW_CLASS[data.bookingStatus as keyof typeof BOOKING_STATUS_TEXT_COL_TW_CLASS],
                )}
              >
                {data.bookingStatus}
              </span>
            </p>
            <p>
              <span className="sr-only">Payment Status: </span>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold capitalize',
                  PAYMENT_STATUS_BG_TW_CLASS[data.paymentStatus as keyof typeof PAYMENT_STATUS_BG_TW_CLASS],
                  PAYMENT_STATUS_TEXT_COL_TW_CLASS[data.paymentStatus as keyof typeof PAYMENT_STATUS_TEXT_COL_TW_CLASS],
                )}
              >
                {data.paymentStatus === 'pending' ? 'Pay At Property' : data.paymentStatus}
              </span>
            </p>
          </div>
          <Link
            href={`/user/my_bookings/hotels/${data.key}`}
            className="rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            target="_blank"
          >
            <SquareArrowOutUpRight className="h-5 w-5 dark:text-gray-300" />
          </Link>
        </div>
      </div>

      {/* Guest and Price */}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Guests: {data.guestsCount}</p>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Total Price: {currencyFormat(data.totalPrice)}
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <SmallDataCard imgSrc={timer} title="Check-In Date" data={checkInDateElement} />
        <SmallDataCard imgSrc={timer} title="Check-Out Date" data={checkOutDateElement} />
        <SmallDataCard imgSrc={timer} title="Check-In Time" data={checkInTimeElement} />
        <SmallDataCard imgSrc={timer} title="Check-Out Time" data={checkOutTimeElement} />
      </div>

      {/* Room Info */}
      <div>
        <h2 className="text-lg font-semibold dark:text-white">Rooms</h2>
        {data.rooms.map((room: any, index: number) => (
          <div
            key={room._id || `room-${index}`}
            className="flex flex-col justify-between gap-1 border-b py-3 md:flex-row md:items-center dark:border-gray-600"
          >
            <p className="text-sm text-muted-foreground dark:text-gray-300">
              # {room.roomType} | Sleeps {room.sleepsCount} | {room.bedOptions}
            </p>
          </div>
        ))}
      </div>

      {/* Footer Action Buttons */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start">
        <Button title="View Booking" asChild size="sm" className="text-wrap">
          <Link title="View Booking" href={`/user/my_bookings/hotels/${data.key}`}>
            <View className="mr h-4 w-4" />
          </Link>
        </Button>
        {canDownload && <DirectDownloadHotelInvoiceButton bookingId={data.key} />}
        {canPay && (
          <Button title="Pay Now" size="sm" asChild>
            <Link href={`/user/my_bookings/hotels/${data.key}/payment`}>
              <HandCoins className="h-4 w-4" />
            </Link>
          </Button>
        )}
        {canCancel && <CancelHotelBookingButton bookingId={data.key} />}
        {canDelete && (
          <Button
            title="Delete Booking"
            size="sm"
            variant="destructive"
            onClick={async () => {
              const res = await deleteHotelBookingAction(data.key);
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