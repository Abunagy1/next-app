import { FlightResultList } from "./FlightResultList";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// this multiSegmentCombinedFareBreakDown function has been moved to app/lib/helpers/flights/fareBreakdown.ts to avoid circular dependencies with priceCalculations.ts which is used in FareCard component and also needs to use the same fare breakdown logic for multi-segment flights
//import { multiSegmentCombinedFareBreakDown } from '@/app/lib/db/schema/flightItineraries';
// it will be imported from fareBreakdown.ts instead which itself imports the singleSegmentFareBreakdown function from priceCalculations.ts without causing circular dependency issues since priceCalculations.ts does not import anything from fareBreakdown.ts
import { multiSegmentCombinedFareBreakDown } from '@/app/lib/helpers/flights/fareBreakdown';
import { minutesToHMFormat } from "@/app/lib/utils";

interface FlightResultProps {
  flightResults: any[];
  searchState: any;
  metaData: any;
}

export async function FlightResult({ flightResults, searchState, metaData }: FlightResultProps) {
  const sortByCheapest = flightResults.slice(0).sort((a, b) => {
    const aTotalPrice = multiSegmentCombinedFareBreakDown(a.segmentIds, searchState.passengers, metaData.flightClass).total;
    const bTotalPrice = multiSegmentCombinedFareBreakDown(b.segmentIds, searchState.passengers, metaData.flightClass).total;
    return +aTotalPrice - +bTotalPrice;
  });

  const sortByQuickest = [...flightResults].sort((a, b) => +a.totalDurationMinutes - b.totalDurationMinutes);

  const mostCheap = multiSegmentCombinedFareBreakDown(sortByCheapest[0]?.segmentIds, searchState.passengers, metaData.flightClass).total || 0;
  const mostQuick = sortByQuickest[0]?.totalDurationMinutes;

  return (
    <div className="flex grow flex-col gap-[32px]">
      <Tabs defaultValue="cheapest" className="w-full">
        <TabsList className="flex h-auto flex-col gap-1 bg-white p-0 sm:flex-row dark:bg-gray-800">
          <TabsTrigger value="cheapest" className="w-full grow justify-start gap-2 dark:text-gray-300 dark:hover:bg-gray-700 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            <div className="text-left">
              <p className="mb-[8px] block font-semibold">Cheapest</p>
              <p className="text-sm text-gray-500">$ {(+mostCheap).toFixed(2)}</p>
            </div>
          </TabsTrigger>
          <TabsTrigger value="quickest" className="w-full grow justify-start gap-2 dark:text-gray-300 dark:hover:bg-gray-700 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white">
            <div className="text-left">
              <p className="mb-[8px] block font-semibold">Quickest</p>
              <p className="text-sm text-gray-500">{minutesToHMFormat(mostQuick || 0)}</p>
            </div>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="cheapest">
          <FlightResultList searchState={searchState} data={sortByCheapest} metaData={metaData} />
        </TabsContent>
        <TabsContent value="quickest">
          <FlightResultList searchState={searchState} data={sortByQuickest} metaData={metaData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}