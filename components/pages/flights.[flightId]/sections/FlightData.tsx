'use client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { LikeButton } from '@/components/local-ui/likeButton';
import share from '@/public/travel/icons/share.svg';
import { FLIGHT_CLASS_PLACEHOLDERS } from '@/app/lib/constants';
import routes from '@/data/routes.json';
import { cn } from '@/app/lib/utils';
import { toast } from 'sonner';
// this multiSegmentCombinedFareBreakDown function has been moved to app/lib/helpers/flights/fareBreakdown.ts to avoid circular dependencies with priceCalculations.ts which is used in FareCard component and also needs to use the same fare breakdown logic for multi-segment flights
//import { multiSegmentCombinedFareBreakDown } from '@/app/lib/db/schema/flightItineraries';
// it will be imported from fareBreakdown.ts instead which itself imports the singleSegmentFareBreakdown function from priceCalculations.ts without causing circular dependency issues since priceCalculations.ts does not import anything from fareBreakdown.ts
import { multiSegmentCombinedFareBreakDown } from '@/app/lib/helpers/flights/fareBreakdown';
interface FlightDataProps {
  data: any;
  searchState: any;
  metaData: any;
  className?: string;
}
export function FlightData({ data, searchState, metaData, className }: FlightDataProps) {
  const { flightCode, _id } = data;
  const { flightClass, isBookmarked } = metaData;
  const { fareBreakdowns, total } = multiSegmentCombinedFareBreakDown(
    data.segmentIds,
    searchState.passengers,
    metaData.flightClass
  );
  const totalPrice = Object.values(fareBreakdowns).reduce(
    (acc: number, item: any) => acc + +item.totalBeforeDiscount,
    0
  );
  const discountedPrice = total;
  const hasDiscount = totalPrice !== discountedPrice;
  const isFlightExpired = metaData.isFlightExpired;
  const isSeatsAvailable = metaData.isSeatsAvailable;
  const bookingDisabled = isFlightExpired || !isSeatsAvailable;
  return (
    <section
      className={cn(
        'rounded-lg bg-white p-6 text-secondary shadow-lg transition duration-300 ease-in-out dark:bg-gray-800 dark:text-gray-200',
        className
      )}
    >
      <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
        <div>
          <div className="mb-2 flex flex-col items-center justify-between gap-2 max-2xsm:flex-col sm:items-start sm:justify-start">
            <p className="text-md font-bold text-primary dark:text-white sm:text-xs">
              {FLIGHT_CLASS_PLACEHOLDERS[flightClass as keyof typeof FLIGHT_CLASS_PLACEHOLDERS]}
            </p>
            <p className="text-3xl font-bold text-primary dark:text-white">
              {hasDiscount && (
                <span className="text-base text-black line-through dark:text-gray-400">
                  ${(+totalPrice).toFixed(2)}
                </span>
              )}{' '}
              <span>${(+discountedPrice).toFixed(2)}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-wrap justify-evenly gap-2">
            <LikeButton
              isBookmarked={isBookmarked}
              keys={{ flightId: _id, searchState }}
              flightOrHotel="flight"
              className="p-3 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            />
              <Button
                variant="outline"
                className="flex items-center justify-center rounded-lg dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                onClick={async () => {
                  const url = window.location.href;
                  try {
                    if (navigator.share) {
                      await navigator.share({ url });
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast.success('Link copied to clipboard!');
                    }
                  } catch (_e) {
                    navigator.clipboard.writeText(url).catch(() => {});
                    toast.success('URL copied (sharing not supported)');
                  }
                }}
              >
                <Image className="min-h-5 min-w-5 dark:invert" src={share} alt="Share icon" />
              </Button>
          </div>
          {!bookingDisabled && (
            <Button
              asChild
              className="hover:bg-primary-dark grow rounded-lg bg-primary px-4 py-2 transition duration-200 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              <Link href={`${routes.flights.path}/${flightCode}_${new Date(data.date).getTime()}/book`}>
                Book Now
              </Link>
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}