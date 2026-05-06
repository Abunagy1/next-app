'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LikeButton } from '@/components/local-ui/likeButton';
import airlinesLogos from '@/data/airlinesLogos';
import { RATING_SCALE } from '@/app/lib/constants';
import { minutesToHMFormat } from '@/app/lib/utils';
import { RatingShow } from '@/components/local-ui/ratingShow';
import { cn } from '@/app/lib/utils';
import Link from 'next/link';
// this multiSegmentCombinedFareBreakDown function has been moved to app/lib/helpers/flights/fareBreakdown.ts to avoid circular dependencies with priceCalculations.ts which is used in FareCard component and also needs to use the same fare breakdown logic for multi-segment flights
//import { multiSegmentCombinedFareBreakDown } from '@/app/lib/db/schema/flightItineraries';
// it will be imported from fareBreakdown.ts instead which itself imports the singleSegmentFareBreakdown function from priceCalculations.ts without causing circular dependency issues since priceCalculations.ts does not import anything from fareBreakdown.ts
import { multiSegmentCombinedFareBreakDown } from '@/app/lib/helpers/flights/fareBreakdown';
import NoSSR from '@/components/helpers/NoSSR';
import ShowTimeInClientSide from '@/components/helpers/ShowTimeInClientSide';

interface FlightResultCardProps {
  data: any;
  searchState: any;
  metaData: any;
}

export function FlightResultCard({ data, searchState, metaData }: FlightResultCardProps) {
  const flightSegments = data.segmentIds;
  const { fareBreakdowns, total } = multiSegmentCombinedFareBreakDown(
    data.segmentIds,
    searchState.passengers,
    metaData.flightClass
  );
  const totalPrice = Object.values(fareBreakdowns).reduce((acc: number, item: any) => acc + +item.totalBeforeDiscount, 0);
  const discountedPrice = total;
  const hasDiscount = totalPrice !== discountedPrice;
  const dateTimestamp = new Date(data.date).getTime();

  return (
    <div className={cn(
        'shadow-small relative flex h-min rounded-l-[8px] rounded-r-[8px] bg-white dark:bg-gray-800 text-[0.75rem] font-medium text-secondary dark:text-gray-300 shadow-md max-md:flex-col',
        metaData.isExpired && 'opacity-50'
      )}>
      {metaData.isExpired && (
        <span className="absolute left-2 top-2 rounded-lg bg-black p-2 text-sm font-bold text-white">Expired</span>
      )}
      <div className="aspect-square h-auto w-full max-md:h-[200px] md:w-[300px]">
        <Image
          width={300}
          height={300}
          className="h-full w-full rounded-l-[12px] object-contain p-5 max-md:rounded-r-[8px] dark:bg-gray-700"
          src={airlinesLogos[data?.carrierInCharge?._id as keyof typeof airlinesLogos] || airlinesLogos.EK}
          alt={data?.carrierInCharge?._id}
          priority
        />
      </div>
      <div className="h-min w-full p-[24px]">
        <div>
          <div className="mb-[16px] flex items-center justify-between">
            <div className="flex items-center gap-[4px]">
              <RatingShow rating={data.ratingReviews.rating} />
              <span className="font-bold dark:text-white">
                {Math.floor(data.ratingReviews.rating) > 0
                  ? RATING_SCALE[Math.floor(data.ratingReviews.rating) as keyof typeof RATING_SCALE]
                  : 'N/A'}
              </span>
              <span className="dark:text-gray-400">{data.ratingReviews.totalReviews} reviews</span>
            </div>
            <div>
              <p className="text-right text-[0.875rem] text-secondary/75 dark:text-gray-400">starting from</p>
              <p className="flex items-center gap-1 text-right text-[1.5rem] font-bold text-tertiary">
                {hasDiscount && (
                  <span className="text-base text-black line-through dark:text-gray-500">${(+totalPrice).toFixed(2)}</span>
                )}
                <span className="dark:text-white">${(+discountedPrice).toFixed(2)}</span>
              </p>
              <p className="text-right text-xs text-secondary/60 dark:text-gray-400">+ taxes & fees</p>
            </div>
          </div>
          {flightSegments.map((segment: any, index: number) => {
            const availableSeatsCount = ((data.availableSeatsCount || []).find(
              (el: any) => el.segmentId === segment._id
            )?.availableSeats) || 0;
            return (
              <div key={segment.from.airport.iataCode + index}>
                <div className="mb-[16px]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex gap-[12px]">
                      <div className="mt-1 h-[18px] min-h-[18px] w-[18px] min-w-[18px] rounded-sm border-2 border-secondary/25"></div>
                      <div>
                        <p className="text-[1rem] font-semibold dark:text-white">
                          <NoSSR fallback="hh:mm aaa">
                            <ShowTimeInClientSide
                              date={new Date(segment?.from?.scheduledDeparture)}
                              formatStr="hh:mm aaa"
                            />
                          </NoSSR>
                          {' - '}
                          <NoSSR fallback="hh:mm aaa">
                            <ShowTimeInClientSide
                              date={new Date(segment?.to?.scheduledArrival)}
                              formatStr="hh:mm aaa"
                            />
                          </NoSSR>
                        </p>
                        <p className="text-[0.875rem] text-secondary/40 dark:text-gray-500">{segment.airlineId._id}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-secondary/75 dark:text-gray-300">
                      {flightSegments.length === 1 && 'non stop'}
                    </p>
                    <div>
                      <p className="text-right font-bold text-secondary/75 dark:text-gray-300">
                        {minutesToHMFormat(+segment?.durationMinutes)}
                      </p>
                      <p className="text-[0.875rem] text-secondary/40 dark:text-gray-400">
                        {segment?.from?.airport?.iataCode}-{segment?.to?.airport?.iataCode}
                      </p>
                    </div>
                  </div>
                  <p className="text-right font-bold text-destructive dark:text-red-400">
                    {availableSeatsCount} seat(s) available
                  </p>
                </div>
                {index !== flightSegments.length - 1 && flightSegments.length > 1 && (
                  <div className="text-center">
                    <p className="font-semibold text-secondary/75 dark:text-gray-400">{`${flightSegments.length - 1} stop(s)`}</p>
                    <p className="dark:text-gray-400">
                      {minutesToHMFormat(
                        (() => {
                          const layovers = typeof data?.layovers === 'string' ? JSON.parse(data.layovers) : (data?.layovers || []);
                          return layovers.find((layover: any) => +layover.fromSegmentIndex === index)?.durationMinutes;
                        })()
                      )}{' '}
                      layover
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Separator className="my-[24px] dark:bg-gray-700" />
        <div className="flex gap-[16px]">
          <LikeButton
            isBookmarked={metaData?.isBookmarked}
            keys={{ flightId: data?._id, searchState }}
            flightOrHotel="flight"
          />
          <Button asChild className="w-full dark:bg-primary dark:hover:bg-primary/80 dark:text-white">
            <Link href={`/flights/${data.flightCode}_${dateTimestamp}`}>
              View Deals
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}