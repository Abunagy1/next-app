/* eslint-disable react-hooks/purity */
import { FlightResult } from '@/components/pages/flights.search/sections/FlightResult';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import validateFlightSearchParams from '@/app/lib/zodSchemas/flightSearchParams';
import { getUserDetails } from '@/app/lib/services/user';
import { getFlights } from '@/app/lib/services/flights';
import { parseFlightSearchParams, passengerStrToObject, airportStrToObject, } from '@/app/lib/utils';
import SetFlightFormState from '@/components/helpers/SetFlightFormState';
import SetCookies from '@/components/helpers/SetCookies';
import SessionTimeoutCountdown from '@/components/local-ui/SessionTimeoutCountdown';
import Jumper from '@/components/local-ui/Jumper';
import { SetLocalStorage } from '@/components/helpers/SetLocalStorage';
import { defaultFlightFormValue } from '@/reduxStore/features/flightFormSlice';
import extractFilterObjFromSearchParams from '@/app/lib/helpers/flights/extractFilterObjFromSearchParams';
import validateFlightSearchFilter from '@/app/lib/zodSchemas/flightSearchFilterValidation';
export default async function FlightResultPage({
  params,
}: {
  params: Promise<{ query: string }>;
}) {
  const { query } = await params;
  const decoded = decodeURIComponent(query);
  const pObj = Object.fromEntries(new URLSearchParams(decoded));
  const { success, errors, data } = validateFlightSearchParams(pObj);
  if (!success) {
    const createValidSearchParams = (params: any, errors: any) => {
      const validParams: any = {};
      if (!errors.from) validParams.from = airportStrToObject(params.from);
      if (!errors.to) validParams.to = airportStrToObject(params.to);
      if (!errors.tripType) validParams.tripType = params.tripType;
      if (!errors.desiredDepartureDate)
        validParams.desiredDepartureDate = params.desiredDepartureDate;
      if (!errors.desiredReturnDate)
        validParams.desiredReturnDate = params.desiredReturnDate;
      if (!errors.class) validParams.class = params.class;
      const passengerRegex = /adults-\d+_children-\d+_infants-\d+/;
      if (passengerRegex.test(params.passengers))
        validParams.passengers = passengerStrToObject(params.passengers);
      return validParams;
    };
    const validSearchParams = createValidSearchParams(pObj, errors);
    return (
      <SetFlightFormState
        obj={{
          ...defaultFlightFormValue,
          ...validSearchParams,
          errors,
        }}
      />
    );
  }
  const filterParamsObj = extractFilterObjFromSearchParams(query);
  //console.log('Flight filters from URL:', filterParamsObj);
  const validateFilterParams = validateFlightSearchFilter(filterParamsObj);
  const finalFilterParams = validateFilterParams?.data || {};
  const sParams = JSON.stringify(data);
  const cookieStore = await cookies();
  const searchStateCookie = cookieStore.get('flightSearchState')?.value;
  const isNewSearch = searchStateCookie !== sParams;
  const session = await getServerSession(authOptions);
  let userDetails: any = null;
  const timeZone = cookieStore.get('timeZone')?.value || 'UTC';
  if (session?.user?.id) {
    userDetails = await getUserDetails(session.user.id);
  }
  const parsedSearchParams = parseFlightSearchParams(data);
  const {
    from,
    to,
    tripType,
    desiredDepartureDate,
    desiredReturnDate,
    class: flightClass,
    passengers,
  } = parsedSearchParams;
  const departureDate = new Date(desiredDepartureDate);
  const returnDate = desiredReturnDate ? new Date(desiredReturnDate) : undefined;
  const flightResults = await getFlights(
    {
      departureAirportCode: from.iataCode,
      arrivalAirportCode: to.iataCode,
      departureDate,
      returnDate,
      tripType,
      flightClass,
      passengersObj: passengers,
      filters: finalFilterParams,
    },
    userDetails?.flights?.bookmarked || [],
    { timeZone }
  );
  const metaData = { flightClass, timeZone };
  const sessionTimeout = cookieStore.get('sessionTimeoutAt')?.value || '0';
  const isSessionExpired = parseInt(sessionTimeout) < Date.now();
  const shouldUpdateLatestSearchstate = isNewSearch || isSessionExpired;
  const newSessionTimeout = Date.now() + 1000 * 1200;
  if (flightResults.length === 0) {
    return (
      <>
        <Jumper id="flightResult">
          <span />
        </Jumper>
        <SetLocalStorage obj={{ sessionTimeoutAt: newSessionTimeout }} />
        {shouldUpdateLatestSearchstate && (
          <SetCookies
            cookies={[
              {
                name: 'flightSearchState',
                value: sParams,
                expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
              },
            ] as any}
          />
        )}
        <div className="flex h-[500px] w-full flex-col items-center justify-center gap-5 text-3xl font-black sm:text-5xl">
          <span className="px-6 text-center leading-normal">No Flights Found</span>
        </div>
      </>
    );
  }
  return (
    <>
      <SetLocalStorage obj={{ sessionTimeoutAt: newSessionTimeout }} />
      {shouldUpdateLatestSearchstate && (
        <SetCookies
          cookies={[
            {
              name: 'flightSearchState',
              value: sParams,
              expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
            },
          ] as any}
        />
      )}
      <div>
        <Jumper id="flightResult">
          <span />
        </Jumper>
        <SessionTimeoutCountdown
          redirectionLink="/flights/search"
          className="mb-2 rounded-md"
          jumpToId="flightFormJump"
        />
        <FlightResult
          flightResults={flightResults}
          searchState={{
            ...parsedSearchParams,
            passengers: {
              adult: passengers.adults,
              child: passengers.children,
              infant: passengers.infants,
            },
          }}
          metaData={metaData}
        />
      </div>
    </>
  );
}