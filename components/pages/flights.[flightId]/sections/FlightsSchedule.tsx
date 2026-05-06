import { FlightScheduleCard } from '@/components/FlightScheduleCard';
import { cn, minutesToHMFormat } from '@/app/lib/utils';

export function FlightDetails({ flight, metaData, className }: any) {
  const flightSegments = flight.segmentIds;
  return (
    <section className={cn('flex flex-col gap-3 p-0 text-secondary', className)}>
      {flightSegments.map((segment: any, index: number) => (
        <div key={index} className="flex flex-col gap-3">
          <FlightScheduleCard
            segment={segment}
            baggageDetails={flight.baggageAllowance}
            metaData={metaData}
          />
          {index !== flightSegments.length - 1 && flightSegments.length > 1 && (
            <div className="w-fit self-center rounded-md bg-tertiary px-5 py-1 text-center font-bold text-white">
              Layover{' '}
              {minutesToHMFormat(
                flight?.layovers?.find(
                  (layover: any) => +layover.fromSegmentIndex === index
                )?.durationMinutes
              )}
            </div>
          )}
        </div>
      ))}
    </section>
  );
}