"use client";
import { FlightResultCard } from "@/components/pages/flights.search/ui/FlightResultCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/app/lib/utils";
interface FlightResultListProps {
  data: any[];
  searchState: any;
  metaData: any;
  resultType?: string;
}
export function FlightResultList({ data, searchState, metaData, resultType = "result(s)" }: FlightResultListProps) {
  const maxResultPerPage = 4;
  const [shownTill, setShownTill] = useState(data.length < maxResultPerPage ? data.length : maxResultPerPage);
  return (
    <>
      <div className="my-10">
        <div className="my-5 flex justify-between text-[0.875rem] font-semibold">
          <p>
            Showing {shownTill} of <span className="text-tertiary">{data.length} {resultType}</span>
          </p>
        </div>
        <div className="mb-5 grid grid-cols-1 gap-[16px]">
          {data.slice(0, shownTill).map((item, index) => (
            <FlightResultCard
              key={item._id || item.id || `flight-${index}`}
              searchState={searchState}
              data={item}
              metaData={{ ...metaData, isBookmarked: item.isBookmarked }}
            />
          ))}
        </div>
        <div>
          <Button
            className={cn("w-full bg-secondary !font-semibold text-white hover:bg-secondary/90 focus:bg-secondary", shownTill >= data.length && "hidden")}
            onClick={() => setShownTill(Math.min(shownTill + maxResultPerPage, data.length))}
          >
            Show more result
          </Button>
        </div>
      </div>
    </>
  );
}