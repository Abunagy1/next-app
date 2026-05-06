'use client';

import { capitalize, cn } from '@/app/lib/utils';
import { Dropdown } from './local-ui/Dropdown';
import { useEffect, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
// this multiSegmentCombinedFareBreakDown function has been moved to app/lib/helpers/flights/fareBreakdown.ts to avoid circular dependencies with priceCalculations.ts which is used in FareCard component and also needs to use the same fare breakdown logic for multi-segment flights
//import { multiSegmentCombinedFareBreakDown } from '@/app/lib/db/schema/flightItineraries';
// it will be imported from fareBreakdown.ts instead which itself imports the singleSegmentFareBreakdown function from priceCalculations.ts without causing circular dependency issues since priceCalculations.ts does not import anything from fareBreakdown.ts
import { multiSegmentCombinedFareBreakDown } from '@/app/lib/helpers/flights/fareBreakdown';
import { multiRoomCombinedFareBreakDown } from '@/app/lib/helpers/hotels/priceCalculation';
import { useDispatch, useSelector } from 'react-redux';
import { setRooms } from '@/reduxStore/features/hotelRoomSelectorSlice';
import { EmptyResult } from './EmptyResult';

export function FareCard({ segments = [], passengersCountObj, flightClass, className = '' }: any) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setTimeout(() => setLoading(false), 500);
  }, []);

  const { fareBreakdowns, total: computedTotal } = multiSegmentCombinedFareBreakDown(
    segments,
    passengersCountObj,
    flightClass
  );

  const fareTypeLabels: Record<string, string> = {
    base: 'Base Fare',
    tax: 'Tax',
    serviceFee: 'Service Fee',
    discount: 'Discount',
  };
  return (
    <div className={cn('flex h-auto w-full min-w-[350px] flex-col gap-4 rounded-2xl bg-white p-4 shadow-xl transition-all duration-300 dark:bg-gray-800', className)}>
      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <Loader2Icon className="animate-spin text-gray-500" size={32} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(fareBreakdowns).map(([guestType, breakdown]: any) => (
            <div key={guestType} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700">
              <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                Passenger Type: {capitalize(guestType)}
              </p>
              <Dropdown
                title={
                  <div className="text-md font-semibold dark:text-white">
                    {`${breakdown.count} traveler${breakdown.count > 1 ? 's' : ''}`}
                  </div>
                }
                defaultOpen={true}
              >
                <div className="flex flex-col gap-2 rounded-md border bg-white p-2 dark:border-gray-600 dark:bg-gray-700">
                  <div className="divide-y divide-gray-200 dark:divide-gray-600">
                    {['base', 'tax', 'serviceFee', 'discount'].map((fareType) => (
                      <div key={fareType} className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{fareTypeLabels[fareType]}</span>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            ${Math.abs(breakdown[fareType]).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ({breakdown.count} × ${Math.abs(+breakdown[fareType] / +breakdown.count).toFixed(2)})
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-md bg-gray-100 px-3 py-2 font-medium text-gray-800 dark:bg-gray-600 dark:text-gray-300">
                    <span>Subtotal</span>
                    <span>${breakdown.total.toFixed(2)}</span>
                  </div>
                </div>
              </Dropdown>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3 text-base font-semibold dark:bg-primary/20">
            <span>Total</span>
            <span>${computedTotal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function HotelFareCard({ searchState, className = '' }: any) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const selectedRooms = JSON.parse(sessionStorage.getItem('selectedRooms') || '[]');
    dispatch(setRooms(selectedRooms));
    setTimeout(() => setLoading(false), 500);
  }, []);

  const selected = useSelector((state: any) => state.hotelRoomsSelector.value);

  const { fareBreakdowns, total: computedTotal } = multiRoomCombinedFareBreakDown(selected, searchState.guests);

  const fareTypeLabels: Record<string, string> = {
    base: 'Base Fare',
    tax: 'Tax',
    serviceFee: 'Service Fee',
    discount: 'Discount',
  };

  return (
    <div className={cn('flex h-auto w-full min-w-[450px] flex-col gap-4 rounded-2xl bg-white p-4 shadow-lg transition-all duration-300 dark:bg-gray-800', className)}>
      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <Loader2Icon className="animate-spin text-gray-500" size={32} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {selected.length === 0 && (
            <EmptyResult
              className="h-auto w-full"
              message="No Room Selected"
              description="Please select at least one room to proceed."
            />
          )}
          {Object.entries(fareBreakdowns).map(([roomType, bedOptions]: any) => (
            <div key={roomType} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-700">
              <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">Room Type: {roomType}</p>
              <div className="flex flex-col gap-3">
                {Object.entries(bedOptions).map(([bedOption, breakdown]: any) => (
                  <Dropdown
                    key={bedOption}
                    title={
                      <div className="text-md font-semibold dark:text-white">
                        {`${bedOption} | ${breakdown.rooms.length} Room${breakdown.rooms.length > 1 ? 's' : ''}`}
                      </div>
                    }
                    defaultOpen={true}
                  >
                    <div className="flex flex-col gap-2 rounded-md border bg-white p-2 dark:border-gray-600 dark:bg-gray-700">
                      {(breakdown.rooms || []).map((room: any, index: number) => (
                        <div key={index} className="rounded bg-gray-50 px-2 py-1 text-sm text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                          {room.description} {room.roomNumber ? `(#${room.roomNumber})` : ''}
                        </div>
                      ))}
                      <div className="mt-2 divide-y divide-gray-200">
                        {['base', 'tax', 'serviceFee', 'discount'].map((fareType) => (
                          <div key={fareType} className="flex items-center justify-between py-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{fareTypeLabels[fareType]}</span>
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                ${Math.abs(breakdown[fareType]).toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ({breakdown.rooms.length} × ${Math.abs(+breakdown[fareType] / +breakdown.rooms.length).toFixed(2)})
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* <div className="mt-3 flex items-center justify-between rounded-md bg-gray-100 px-3 py-2 font-medium text-gray-800 dark:bg-gray-600 dark:text-gray-300"> */}
                      <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3 text-base font-semibold dark:bg-primary/20">
                        <span className="dark:text-white">Subtotal</span>
                        <span className="dark:text-white">${breakdown.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </Dropdown>
                ))}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3 text-base font-semibold dark:bg-primary/20">
            <span className="dark:text-white">Total</span>
            <span className="dark:text-white">${computedTotal.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}