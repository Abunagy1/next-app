'use client';

import { FlightResultCard } from '@/components/pages/flights.search/ui/FlightResultCard';

// ✅ Define missing types directly
interface FlightMetaData {
  flightClass: string;
  timeZone: string;
  isBookmarked: boolean;
  isExpired?: boolean;
}

interface FlightSearchState {
  passengers: {
    adult: number;
    child: number;
    infant: number;
  };
  class: string;
  // ... other fields as needed
}

interface FavouriteFlight {
  _id: string;
  searchState: FlightSearchState;
  metaData: FlightMetaData;
  // ... other flight fields
}

interface FavouriteFlightListSectionProps {
  favouriteFlights: FavouriteFlight[];
}

export function FavouriteFlightListSection({ favouriteFlights }: FavouriteFlightListSectionProps) {
  if (favouriteFlights.length < 1) {
    return (
      <h1 className="h-full rounded-md bg-white py-20 text-center text-[1.25rem] font-semibold text-secondary shadow-md dark:bg-gray-800 dark:text-white">
        No favourite flights
      </h1>
    );
  }

  return (
    <div className="mb-5 grid grid-cols-1 gap-[16px]">
      {favouriteFlights.map((flight) => (
        <FlightResultCard
          key={flight._id}
          data={flight}
          searchState={flight.searchState}
          metaData={flight.metaData}
        />
      ))}
    </div>
  );
}