import { EmptyResult } from '@/components/EmptyResult';
import SearchHistoryCard from '@/components/SearchHistoryCard';
import { parseFlightSearchParams } from '@/app/lib/utils';

interface RecentSearchesProps {
  searchesArr: any[];
}

export async function RecentSearches({ searchesArr = [] }: RecentSearchesProps) {
  return (
    <section className="mb-[80px]">
      <div className="mb-[32px] text-[2rem] font-semibold text-secondary dark:text-white">Your recent searches</div>
      {searchesArr.length === 0 ? (
        <EmptyResult message="No recent searches" description="" className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"  />
      ) : (
        <div className="grid gap-[16px] md:grid-cols-2 lg:grid-cols-3">
          {searchesArr
            .filter((s) => s.searchState && (typeof s.searchState === 'string' || typeof s.searchState === 'object'))
            .map((search) => {
              const sState = search.searchState;
            let data: any = {
              type: search.type,
              searchState: sState,
              searchedAt: search.createdAt,
            };
            if (search.type === 'flight') {
              const parsedState = parseFlightSearchParams(sState);
              data = {
                ...data,
                tripType: parsedState.tripType,
                details: `${parsedState.from.city} (${parsedState.from.iataCode}) → ${parsedState.to.city} (${parsedState.to.iataCode})`,
                class: parsedState.class,
                passengers: Object.values(parsedState.passengers).reduce((acc: number, val: any) => acc + (Number(val) || 0), 0),
                departureDate: parsedState.desiredDepartureDate,
                returnDate: parsedState.desiredReturnDate,
              };
            }
            if (search.type === 'hotel') {
              data = {
                ...data,
                details: `${sState.city}, ${sState.country}`,
                rooms: sState.rooms,
                guests: sState.guests,
                checkInDate: +sState.checkIn,
                checkOutDate: +sState.checkOut,
              };
            }
            return <SearchHistoryCard key={search._id} search={data} />;
          })}
        </div>
      )}
    </section>
  );
}