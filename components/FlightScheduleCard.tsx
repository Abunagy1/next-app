'use client';

import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import airlinesLogos from '@/data/airlinesLogos';
import plane from '@/public/travel/icons/airplane-filled.svg';
import lineLeft from '@/public/travel/icons/line-left.svg';
import lineRight from '@/public/travel/icons/line-right.svg';
import { minutesToHMFormat } from '@/app/lib/utils';
import { cn } from '@/app/lib/utils';
import { Dropdown } from '@/components/local-ui/Dropdown';
import NoSSR from '@/components/helpers/NoSSR';
import ShowTimeInClientSide from '@/components/helpers/ShowTimeInClientSide';
import BaggageDetails from '@/components/pages/flights.[flightId]/sections/BaggageDetails';

// interface SegmentPoint {
//   scheduledDeparture?: string;
//   scheduledArrival?: string;
//   airport: {
//     iataCode: string;
//     name: string;
//   };
//   terminal: string;
//   gate: string;
// }

// interface Segment {
//   from: SegmentPoint;
//   to: SegmentPoint;
//   durationMinutes: number;
//   airlineId: {
//     iataCode: string;
//     name: string;
//   };
//   airplaneId: {
//     model: string;
//   };
// }

// interface FlightScheduleCardProps {
//   segment: Segment;
//   baggageDetails: any;
//   metaData: any;
//   className?: string;
// }


interface Segment {
  from: {
    scheduledDeparture: string | Date;
    airport: {
      name: string;
      iataCode: string;
    };
    terminal?: string;
    gate?: string;
  };
  to: {
    scheduledArrival: string | Date;
    airport: {
      name: string;
      iataCode: string;
    };
    terminal?: string;
    gate?: string;
  };
  durationMinutes: number;
  airlineId: {
    iataCode: string;
    name: string;
  };
  airplaneId: {
    model: string;
  };
}

interface FlightScheduleCardProps {
  segment: Segment;
  baggageDetails: any;
  metaData?: any;
  className?: string;
}

export function FlightScheduleCard({
  segment,
  baggageDetails,
  metaData,
  className,
}: FlightScheduleCardProps) {
  const { from, to, durationMinutes, airlineId, airplaneId } = segment;

  return (
    <div className={cn('rounded-[12px] bg-white px-[24px] py-[32px] shadow-lg dark:bg-gray-800 dark:text-white', className)}>
      <div className="mb-[24px] flex justify-between font-bold">
        <h4 className="text-[1.25rem]">
          Depart{' '}
          <NoSSR>
            <ShowTimeInClientSide date={from.scheduledDeparture} formatStr="eee, MMM d, yyyy" />
          </NoSSR>
        </h4>
        <p className="font-medium opacity-75">{minutesToHMFormat(+durationMinutes)}</p>
      </div>
      <div className="mb-[40px] grid justify-start gap-[20px] md:flex">
        <div className="flex w-fit flex-wrap items-center justify-center gap-[24px] rounded-[8px] border border-primary px-[32px] py-[16px] dark:border-gray-600 dark:bg-gray-700">
          <Image
            height={40}
            width={60}
            src={airlinesLogos[airlineId.iataCode as keyof typeof airlinesLogos] || airlinesLogos.EK}
            alt="airline_logo"
            className="h-16 w-auto"
          />
          <div>
            <h3 className="mb-[8px] text-[1.5rem] font-semibold">{airlineId.name}</h3>
            <p className="text-[0.875rem] font-medium opacity-60">{airplaneId.model}</p>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
        <div className="flex flex-col font-semibold">
          <span className="text-[1rem] lg:text-[1.5rem] dark:text-white">
            <NoSSR fallback="h:mm aaa">
              <ShowTimeInClientSide date={from.scheduledDeparture} formatStr="h:mm aaa" />
            </NoSSR>
          </span>{' '}
          <span className="lg:text-[1.5rem] dark:text-white">
            <NoSSR fallback="eee, MMM d, yyyy">
              <ShowTimeInClientSide date={from.scheduledDeparture} formatStr="eee, MMM d, yyyy" />
            </NoSSR>
          </span>{' '}
          <span className="max-lg:text-[0.75rem] dark:text-gray-300">{`${from.airport.name} (${from.airport.iataCode})`}</span>
          <span className="max-lg:text-[0.75rem] dark:text-gray-300">{`Terminal: ${from.terminal || 'N/A'}`}</span>
          <span className="max-lg:text-[0.75rem] dark:text-gray-300">{`Gate: ${from.gate || 'N/A'}`}</span>
        </div>
        <div className="flex grow items-center justify-center gap-4 max-md:flex-col">
          <Image
            src={lineLeft}
            width={36}
            height={36}
            className="min-h-[36px] min-w-[36px] max-md:rotate-90"
            alt="lineleft_icon"
          />
          <Image
            src={plane}
            alt="plane_icon"
            className="min-h-[48px] min-w-[48px] max-md:rotate-90"
            height={48}
            width={48}
          />
          <Image
            className="min-h-[36px] min-w-[36px] max-md:rotate-90"
            width={36}
            height={36}
            src={lineRight}
            alt="lineright_icon"
          />
        </div>
        <div className="flex flex-col font-semibold">
          <span className="lg:text-[1.5rem]">
            <NoSSR fallback="h:mm aaa">
              <ShowTimeInClientSide date={to.scheduledArrival} formatStr="h:mm aaa" />
            </NoSSR>
          </span>{' '}
          <span className="lg:text-[1.5rem]">
            <NoSSR fallback="eee, MMM d, yyyy">
              <ShowTimeInClientSide date={to.scheduledArrival} formatStr="eee, MMM d, yyyy" />
            </NoSSR>
          </span>{' '}
          <span className="max-lg:text-[0.75rem] dark:text-gray-300">{`${to.airport.name} (${to.airport.iataCode})`}</span>
          <span className="max-lg:text-[0.75rem] dark:text-gray-300">{`Terminal: ${to.terminal || 'N/A'}`}</span>
          <span className="max-lg:text-[0.75rem] dark:text-gray-300">{`Gate: ${to.gate || 'N/A'}`}</span>
        </div>
      </div>
      <Separator className="dark:bg-gray-700" />
      <Dropdown title={<h4 className="text-lg font-bold dark:text-white">Baggage Details</h4>}>
        <BaggageDetails baggage={baggageDetails} />
      </Dropdown>
    </div>
  );
}