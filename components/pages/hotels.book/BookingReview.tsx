'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, intervalToDuration } from 'date-fns';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import hotelRoomReserveAction from '@/app/lib/actions/hotelRoomReserveAction';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import validateGuestForm from '@/app/lib/zodSchemas/hotelGuestsFormValidation';
import Image from 'next/image';

interface BookingReviewProps {
  nextStep: string;
  hotelDetails: any;
  searchState: any;
}

export default function BookingReview({ nextStep, hotelDetails, searchState }: BookingReviewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const searchInfo = {
    checkInDate: searchState.checkIn,
    checkOutDate: searchState.checkOut,
    nights: intervalToDuration({
      start: new Date(searchState.checkIn),
      end: new Date(searchState.checkOut),
    }).days,
  };

  const [guestInfo, setGuestInfo] = useState<any[]>([]);
  const [hasGuestFormErrors, setHasGuestFormErrors] = useState(false);
  const [selectedRooms, setRooms] = useState<any[]>([]);

  const strHotelDetails = JSON.stringify(hotelDetails);
  const strSearchState = JSON.stringify(searchState);

  useEffect(() => {
    const guestsDetails = JSON.parse(sessionStorage.getItem('guests') || '{}');
    const selectedRoomsData = JSON.parse(sessionStorage.getItem('selectedRooms') || '[]');
    const guestsArr = Object.values(guestsDetails);
    const guestData = guestsArr.length ? guestsArr : Array(searchState.guests).fill({});

    let key = 0;
    const err: any = {};
    const data: any = {};

    for (const guestForm of guestData) {
      const validate = validateGuestForm(guestForm);
      if (!validate.success) {
        err[key] = validate.errors;
      }
      if (validate.success) {
        data[key] = validate.data;
      }
      key++;
    }
    if (Object.keys(err).length) {
      sessionStorage.setItem('guestsFormErrors', JSON.stringify(err));
      queueMicrotask(() => {
        setHasGuestFormErrors(true);
        setGuestInfo(guestsArr);
        setRooms(selectedRoomsData);
      });
    } else {
      queueMicrotask(() => {
        setGuestInfo(guestsArr);
        setRooms(selectedRoomsData);
      });
    }
  }, [strHotelDetails, strSearchState, searchState.guests]);

  function formatDate(date: any) {
    try {
      return format(new Date(date), 'dd MMM yyyy');
    } catch {
      return date;
    }
  }

  async function handleConfirm(e: React.MouseEvent<HTMLButtonElement>) {
    const button = e.currentTarget as HTMLButtonElement;
    button.disabled = true;
    const bookingData = {
      guests: guestInfo,
      selectedRooms: selectedRooms,
      hotelId: hotelDetails.id || hotelDetails._id,   // ← add this
    };
    const res = await hotelRoomReserveAction(bookingData);
    button.disabled = false;
    if (res.success) {
      sessionStorage.removeItem('guests');
      sessionStorage.removeItem('selectedRooms');
      router.push(`${pathname}?tab=${nextStep}`);
    }
  if (!res.success) {
    // Check for room already reserved by message content
    if (res.message?.toLowerCase().includes('already reserved')) {
      toast.error(res.message);
      setTimeout(() => {
        router.push(`${pathname}?tab=${nextStep}`);
      }, 1000);
      return;
    }
  toast.error(res.message || 'Failed to reserve room');
}
  }

  function setProgress(step: string) {
    router.push(`${pathname}?tab=${step}`);
  }

  return (
    <div className="space-y-6 dark:bg-gray-800 dark:text-gray-200">
      <Card className="flex items-start gap-4 p-4 dark:bg-gray-800 dark:border-gray-700">
        <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded border">
          <Image
            src={hotelDetails.images[0] || '/placeholder.jpg'}
            alt="Hotel preview"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <CardContent className="space-y-1 p-0">
          <h2 className="text-lg font-semibold dark:text-white">{hotelDetails.name}</h2>
          <p className="text-sm leading-tight text-muted-foreground dark:text-gray-400">
            {hotelDetails.address?.streetAddress}, {hotelDetails.address?.city}, {hotelDetails.address?.country}
          </p>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            {formatDate(searchInfo.checkInDate)} to {formatDate(searchInfo.checkOutDate)} ({searchInfo.nights} night
            {searchInfo.nights !== 1 && 's'})
          </p>
        </CardContent>
      </Card>

      {!hasGuestFormErrors ? (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="space-y-2 p-4">
            <h3 className="mb-2 text-lg font-bold dark:text-white">Guest Information</h3>
            {guestInfo.map((guest: any, index: number) => (
              <div key={index} className="space-y-2 pl-2">
                <h4 className="text-md font-semibold">
                  Guest {index + 1} {guest.isPrimary ? '(Primary)' : ''}
                </h4>
                <div className="grid grid-cols-1 gap-3 rounded-md border bg-muted p-3 md:grid-cols-2 dark:bg-gray-700 dark:border-gray-600">
                  <p>
                    <span className="font-medium dark:text-gray-300">Full Name:</span> <span className="dark:text-white">{guest.firstName} {guest.lastName}</span>
                  </p>
                  {guest.email && (
                    <p>
                      <span className="font-medium dark:text-gray-300">Email:</span> <span className="dark:text-white">{guest.email}</span>
                    </p>
                  )}
                  {guest.phone?.dialCode && (
                    <p>
                      <span className="font-medium dark:text-gray-300">Phone:</span> <span className="dark:text-white">{guest.phone.dialCode} {guest.phone.number}</span>
                    </p>
                  )}
                  <p className="capitalize">
                    <span className="font-medium dark:text-gray-300">Guest Type:</span> <span className="dark:text-white">{guest.guestType}</span>
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 rounded-md border border-red-300 bg-red-50 p-6 shadow-sm dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Guest Details Incomplete</h2>
          </div>
          <p className="max-w-md text-center text-sm text-red-700 dark:text-red-300">
            Please go back and fix the guest details before proceeding.
          </p>
          <Button
            size="lg"
            onClick={() => setProgress('guest_info')}
            className="bg-red-600 font-semibold text-white hover:bg-red-700"
          >
            Go Back & Fix Details
          </Button>
        </div>
      )}

      {selectedRooms.length > 0 ? (
        <SelectedRoomsCard selectedRooms={selectedRooms} />
      ) : (
        <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 rounded-md border border-red-300 bg-red-50 p-6 shadow-sm dark:bg-red-900/20 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-6 w-6" />
            <h2 className="text-xl font-semibold">No Rooms Selected</h2>
          </div>
          <p className="max-w-md text-center text-sm text-red-700 dark:text-red-300">
            Please select at least one room to proceed.
          </p>
          <Button
            size="lg"
            onClick={() => setProgress('select_room')}
            className="bg-red-600 font-semibold text-white hover:bg-red-700"
          >
            Go Back & Fix Details
          </Button>
        </div>
      )}

      <div className="text-end">
        <Button onClick={handleConfirm}>Reserve</Button>
      </div>
    </div>
  );
}

function SelectedRoomsCard({ selectedRooms = [] }: { selectedRooms: any[] }) {
  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardContent className="space-y-3 p-4">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">Selected Rooms</h3>
          <p className="text-sm text-muted-foreground dark:text-gray-400">{selectedRooms.length} selected</p>
        </div>
        {selectedRooms.map((room: any, index: number) => (
          <div
            key={room._id || index}
            className="flex flex-col gap-4 border-b py-4 last:border-none md:flex-row dark:border-gray-700"
          >
            <div className="relative h-24 w-full overflow-hidden rounded-md border md:w-40 dark:border-gray-600">
              <Image
                src={room.images?.[0] || '/placeholder.jpg'}
                alt="Room preview"
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            <div className="flex-1 space-y-1 font-semibold">
              <p className="text-sm dark:text-white">
                {room.roomType} | {room.bedOptions}
              </p>
              <p className="text-xs dark:text-gray-400">Guests Count: {room.sleepsCount}</p>
              <p className="text-xs dark:text-gray-400">Floor: {room.floor}</p>
              <p className="text-xs dark:text-gray-400">Room Number: {room.roomNumber}</p>
              <div className="mt-2 flex flex-wrap gap-1 text-xs font-semibold">
                Features:{' '}
                {room.features?.slice(0, 5).map((feature: string, i: number) => (
                  <span key={`feature-${i}`} className="rounded bg-muted px-2 py-0.5 text-foreground dark:bg-gray-700 dark:text-gray-300">
                    {feature}
                  </span>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-1 text-xs font-semibold">
                Amenities:{' '}
                {room.amenities?.slice(0, 5).map((amenity: string, i: number) => (
                  <span key={`amenity-${i}`} className="rounded bg-muted px-2 py-0.5 text-foreground dark:bg-gray-700 dark:text-gray-300">
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}