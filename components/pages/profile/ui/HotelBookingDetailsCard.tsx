'use client';

import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn, currencyFormat } from '@/app/lib/utils';
import { SmallDataCard } from '@/components/pages/profile/ui/SmallDataCard';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import NoSSR from '@/components/helpers/NoSSR';

import ShowTimeInClientSide from '@/components/helpers/ShowTimeInClientSide';
import {
  BOOKING_STATUS_BG_COL_TW_CLASS,
  BOOKING_STATUS_TEXT_COL_TW_CLASS,
  PAYMENT_STATUS_BG_TW_CLASS,
  PAYMENT_STATUS_TEXT_COL_TW_CLASS,
} from '@/app/lib/constants';
import {
  CancelHotelBookingButton,
  ConfirmNowPayAtHotelButton,
  RequestRefundHotelBookingButton,
} from '../../hotels.[bookingId]/ActionsButtons';
import { allowedHotelBookingActionBtns } from '@/app/lib/helpers/hotels/allowedHotelBookingActionBtns';
import { parseHotelCheckInOutPolicy } from '@/app/lib/helpers/hotels';
import calender from '@/public/travel/icons/calender-mint.svg';
import timer from '@/public/travel/icons/timer-mint.svg';
import StatusChip from '@/components/local-ui/StatusChip';
import { DeleteHotelBookingButton } from '../../hotels.[bookingId]/DeleteHotelBookingButton';
interface Room {
  key: string;
  bedOptions: string;
  roomType: string;
  floor: number;
  roomNumber: string;
  sleepsCount: number;
}

interface Guest {
  key: string;
  firstName: string;
  lastName: string;
  guestType: string;
  email?: string;
  phone?: string;
}

interface BookingData {
  key: string;
  bookingId: string;
  bookingStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  bookedAt: string;
  hotelAddress: string;
  checkInDate: string;
  checkOutDate: string;
  cancellationPolicy: any;
  refundPolicy: any;
  nights: number;
  checkInTime: string;
  checkOutTime: string;
  rooms: Room[];
  guests: Guest[];
  totalPrice: number;
  hotelImage?: string;
}

interface HotelBookingDetailsCardProps {
  className?: string;
  bookingData: BookingData;
}

export default function HotelBookingDetailsCard({
  className,
  bookingData,
}: HotelBookingDetailsCardProps) {
  const {
    key,
    bookingId,
    bookingStatus,
    paymentStatus,
    paymentMethod,
    bookedAt,
    hotelAddress,
    checkInDate,
    checkOutDate,
    cancellationPolicy,
    refundPolicy,
    nights,
    checkInTime,
    checkOutTime,
    rooms,
    guests,
    totalPrice,
    hotelImage,
  } = bookingData;

  const cin = parseHotelCheckInOutPolicy(checkInTime);
  const cout = parseHotelCheckInOutPolicy(checkOutTime);
  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  checkIn.setHours(cin.hour, cin.minute, 0, 0);
  checkOut.setHours(cout.hour, cout.minute, 0, 0);

  const checkInDateObj = new Date(bookingData.checkInDate);
  const { canConfirm, canCancel, canRefund, canDownload, canDelete, canPay } =
    allowedHotelBookingActionBtns(
      bookingData.bookingStatus,
      bookingData.paymentStatus,
      bookingData.cancellationPolicy,
      bookingData.refundPolicy,
      checkInDateObj,
    );

  const bookingStatusBgClass =
    BOOKING_STATUS_BG_COL_TW_CLASS[bookingStatus as keyof typeof BOOKING_STATUS_BG_COL_TW_CLASS];
  const bookingStatusTextClass =
    BOOKING_STATUS_TEXT_COL_TW_CLASS[bookingStatus as keyof typeof BOOKING_STATUS_TEXT_COL_TW_CLASS];
  const paymentStatusBgClass =
    PAYMENT_STATUS_BG_TW_CLASS[paymentStatus as keyof typeof PAYMENT_STATUS_BG_TW_CLASS];
  const paymentStatusTextClass =
    PAYMENT_STATUS_TEXT_COL_TW_CLASS[paymentStatus as keyof typeof PAYMENT_STATUS_TEXT_COL_TW_CLASS];

  return (
    <div className={cn('space-y-6 rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-800 dark:border-gray-700', className)}>
      {/* Header: Hotel Image + Statuses */}
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_auto]">
        <div className="flex gap-4">
          {hotelImage && (
            <Image
              src={hotelImage}
              alt="Hotel Image"
              width={140}
              height={105}
              className="rounded-lg border object-cover"
            />
          )}
          <div>
            <p className="text-base font-semibold dark:text-white">{hotelAddress}</p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Booking ID: <span className="font-medium dark:text-white">{bookingId}</span>
            </p>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Booked At:{' '}
              <NoSSR fallback="dd MMM yyyy, hh:mm:ss a">
                <ShowTimeInClientSide date={bookedAt} formatStr="dd MMM yyyy, hh:mm:ss a" />
              </NoSSR>
            </p>
          </div>
        </div>
        {/* Status Chips */}
        <div className="flex flex-col items-end gap-2">
          <StatusChip
            text={bookingStatus}
            bg={bookingStatusBgClass}
            color={bookingStatusTextClass}
          />
          <StatusChip
            text={
              paymentMethod === 'cash' &&
              bookingStatus === 'confirmed' &&
              paymentStatus === 'pending'
                ? 'Pay On Property'
                : paymentStatus
            }
            bg={paymentStatusBgClass}
            color={paymentStatusTextClass}
          />
        </div>
      </div>

      {/* Price Summary */}
      <div className="text-sm font-semibold">
        Total Price:{' '}
        <span className="font-bold text-primary">{currencyFormat(totalPrice)}</span>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SmallDataCard
          imgSrc={calender}
          title="Check-In"
          data={
            <>
              <NoSSR fallback="dd MMM yyyy">
                <ShowTimeInClientSide date={checkInDate} formatStr="d MMM yyyy" />
              </NoSSR>
              {checkInTime && (
                <span className="block text-xs text-muted-foreground">
                  at {format(checkIn, 'hh:mm aaa')}
                </span>
              )}
            </>
          }
        />
        <SmallDataCard
          imgSrc={calender}
          title="Check-Out"
          data={
            <>
              <NoSSR fallback="dd MMM yyyy">
                <ShowTimeInClientSide date={checkOutDate} formatStr="d MMM yyyy" />
              </NoSSR>
              {checkOutTime && (
                <span className="block text-xs text-muted-foreground">
                  at {format(checkOut, 'hh:mm aaa')}
                </span>
              )}
            </>
          }
        />
        <SmallDataCard imgSrc={timer} title="Nights" data={nights || '—'} />
      </div>

      {/* Room Accordion */}
      <Accordion type="single" collapsible>
        <AccordionItem value="rooms">
          <AccordionTrigger>Rooms ({rooms.length})</AccordionTrigger>
          <AccordionContent>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room, idx) => (
                <div key={room.key || idx} className="space-y-1 rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                  <p className="font-medium dark:text-white">{room.bedOptions}</p>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Type: {room.roomType}</p>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Floor: {room.floor}</p>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Room #: {room.roomNumber}</p>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Sleeps: {room.sleepsCount}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Guest Accordion */}
      <Accordion type="single" collapsible>
        <AccordionItem value="guests">
          <AccordionTrigger>Guests ({guests.length})</AccordionTrigger>
          <AccordionContent>
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {guests.map((guest, idx) => (
                <div key={guest.key || idx} className="space-y-1 rounded-xl border bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                  <p className="font-medium dark:text-white">{guest.firstName} {guest.lastName}</p>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">Type: {guest.guestType}</p>
                  {guest.email && (
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Email: {guest.email}</p>
                  )}
                  {guest.phone && (
                    <p className="text-sm text-muted-foreground dark:text-gray-400">Phone: {guest.phone}</p>
                  )}
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-end gap-3 border-t pt-4 dark:border-gray-700">
        <Button variant="secondary" className="min-w-[100px]" asChild>
          <Link href={`/user/my_bookings/hotels/${key}`}>View</Link>
        </Button>
        {canConfirm && <ConfirmNowPayAtHotelButton bookingId={bookingId} />}
        {canPay && (
          <Button variant="default" className="min-w-[100px]" asChild>
            <Link href={`/user/my_bookings/hotels/${key}/payment`}>Pay Now</Link>
          </Button>
        )}
        {canDownload && (
          <Button variant="outline" className="min-w-[100px]" asChild>
            <Link href={`/user/my_bookings/hotels/${key}/invoice`}>Invoice</Link>
          </Button>
        )}
        {canCancel && <CancelHotelBookingButton bookingId={bookingId} />}
        {canRefund && <RequestRefundHotelBookingButton bookingId={bookingId} />}
        {canDelete && <DeleteHotelBookingButton bookingId={bookingId} />}
      </div>
    </div>
  );
}