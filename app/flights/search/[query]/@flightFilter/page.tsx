import { FlightsFilter } from '@/components/pages/flights.search/sections/FlightFilter';
import { getManyDocs } from '@/app/lib/db/getOperationDB';
import { sql, dbType } from '@/app/lib/db/index';
import { multiSegmentCombinedFareBreakDown } from '@/app/lib/helpers/flights/fareBreakdown';
import { parseFlightSearchParams } from '@/app/lib/utils';
import validateFlightSearchFilter from '@/app/lib/zodSchemas/flightSearchFilterValidation';
import { startOfDay, endOfDay } from 'date-fns';
import { getTimezoneOffset } from 'date-fns-tz';
import { cookies } from 'next/headers';

export default async function FlightFilterPage({
  params,
}: {
  params: Promise<{ query: string }>;
}) {
  const { query } = await params;
  const decoded = decodeURIComponent(query);
  const pObj = Object.fromEntries(new URLSearchParams(decoded));
  const parsedSearchParams = parseFlightSearchParams(pObj);
  const {
    from,
    to,
    desiredDepartureDate,
    class: flightClass,
    passengers,
  } = parsedSearchParams;

  const cookieStore = await cookies();
  const timeZone = cookieStore.get('timeZone')?.value || 'UTC';

  const departureDate = new Date(desiredDepartureDate);
  const zoneOffsetMs = getTimezoneOffset(timeZone, departureDate);

  // Calculate date range with timezone offset applied
  const startDate = new Date(startOfDay(departureDate).getTime() - zoneOffsetMs);
  const endDate = new Date(endOfDay(departureDate).getTime() - zoneOffsetMs);

  let flightResults: any[];

  if (dbType === 'postgres') {
    const rows = await sql`
      SELECT 
        fi.id, 
        fi.flight_code, 
        fi.date, 
        fi.carrier_in_charge, 
        fi.segment_ids,
        fi.total_duration_minutes,
        fi.layovers,
        fi.baggage_allowance,
        fi.status,
        fi.expire_at
      FROM flight_itineraries fi
      WHERE fi.departure_airport_id = ${from.iataCode}
        AND fi.arrival_airport_id = ${to.iataCode}
        AND fi.date >= ${startDate}
        AND fi.date <= ${endDate}
        AND fi.status = 'scheduled'
    `;

    flightResults = await Promise.all(
      rows.map(async (row: any) => {
        const segmentRows = await sql`
          SELECT 
            fs.id, 
            fs.flight_number, 
            fs.duration_minutes,
            fs.fare_details
          FROM flight_segments fs
          WHERE fs.id = ANY(${row.segment_ids}::uuid[])
        `;
        const segments = segmentRows.map((seg: any) => ({
          _id: seg.id,
          flightNumber: seg.flight_number,
          durationMinutes: seg.duration_minutes,
          fareDetails: seg.fare_details,
        }));
        return {
          ...row,
          segmentIds: segments,
          carrierInCharge: { _id: row.carrier_in_charge },
        };
      })
    );
  } else {
    flightResults = await getManyDocs(
      'FlightItinerary',
      {
        departureAirportId: from.iataCode,
        arrivalAirportId: to.iataCode,
        date: {
          $gte: startDate.getTime(),
          $lte: endDate.getTime(),
        },
        status: 'scheduled',
      },
      ['flights']
    );
  }

  const totalFares: number[] = [];
  const airlines = new Set<string>();

  for (const flight of flightResults) {
    const { total } = multiSegmentCombinedFareBreakDown(
      flight.segmentIds,
      {
        adult: passengers.adults,
        child: passengers.children,
        infant: passengers.infants,
      },
      flightClass
    );
    totalFares.push(total);
    airlines.add(flight.carrierInCharge._id);
  }

  const minFare = Math.min(...totalFares) || 0;
  const maxFare = Math.max(...totalFares) || 0;

  const defaultFilterObj = {
    priceRange: [Math.floor(minFare), Math.ceil(maxFare)],
    airlines: Array.from(airlines),
  };

  const filterSearchParams = Object.entries(pObj).filter(([key]) =>
    key.startsWith('filter_')
  );
  const filters: any = {};

  for (const [key, value] of filterSearchParams) {
    const filterKey = key.split('filter_')[1];
    let filterValue: string[] | number[] = (value as string).split(',').filter(Boolean);

    if (filterKey === 'priceRange' || filterKey === 'departureTime') {
      filterValue = (filterValue as string[])
        .map((v) => parseInt(v, 10))
        .filter((v) => !isNaN(v));
    }

    if (filterKey === 'rates') {
      filterValue = [...new Set((filterValue as string[]).map(String))];
    }

    if (filterValue.length > 0) {
      filters[filterKey] = filterValue;
    }
  }

  const validatedFilters = validateFlightSearchFilter(filters);

  return (
    <FlightsFilter
      filters={validatedFilters.data || {}}
      defaultFilterObj={defaultFilterObj}
      query={query}
    />
  );
}