'use client';

import React, { Fragment, useLayoutEffect, useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { isObject, minutesToHMFormat } from '@/app/lib/utils';
import validatePassengerDetails from '@/app/lib/zodSchemas/passengerDetailsValidation';
import validatePassengerPreferences from '@/app/lib/zodSchemas/passengersPreferencesValidation';
import { AlertTriangle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import NoSSR from '@/components/helpers/NoSSR';

interface ReviewBookingProps {
  flight: any;
  reserveActionError?: any;
  setReserveActionError?: React.Dispatch<React.SetStateAction<any>>;
  formsError?: any;
  setFormsError?: React.Dispatch<React.SetStateAction<any>>;
  onConfirm: (e: React.MouseEvent<HTMLButtonElement>) => void;
  nextStep?: string;
}
const SectionHeader = ({ title }: { title: string }) => <h3 className="text-xl font-semibold">{title}</h3>;
const FlightDetails = ({ flight }: { flight: any }) => {
  return (
    <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <p className="text-gray-600 dark:text-gray-400">Flight Number</p>
          <p className="font-semibold dark:text-white">{flight.flightNumber}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Airline</p>
          <p className="font-semibold dark:text-white">{flight.airlineId.name}</p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Departure</p>
          <div className="font-semibold">
            <NoSSR fallback="eee, MMM d, yyyy">
              {format(new Date(flight.from.scheduledDeparture), 'eee, MMM d, yyyy')}
            </NoSSR>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {flight.from.airport.name} - Terminal {flight.from.terminal}
          </p>
        </div>
        <div>
          <p className="text-gray-600 dark:text-gray-400">Arrival</p>
          <div className="font-semibold">
            <NoSSR fallback="eee, MMM d, yyyy">
              {format(new Date(flight.to.scheduledArrival), 'eee, MMM d, yyyy')}
            </NoSSR>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {flight.to.airport.name} - Terminal {flight.to.terminal}
          </p>
        </div>
      </div>
    </div>
  );
};

const PassengerCard = ({ passenger, preferences }: { passenger: any; preferences: any }) => {
  const p = { ...passenger };
  delete p.key;
  delete p.errors;
  delete p.saveDetails;
  delete p.isPrimary;

  const pref = { ...preferences };
  delete pref.errors;
  delete pref.key;
  delete pref.passengerType;

  return (
    <div className="mb-4 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
      <h2 className="text-2xl font-semibold dark:text-white">{passenger.key}</h2>
      <Separator className="my-3 dark:bg-gray-700" />
      <div>
        <h4 className="mb-3 text-xl font-semibold dark:text-gray-200">Details</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.entries(p).map(([key, value]: any) => {
            let displayValue = value;
            // if (key === 'phoneNumber' && isObject(value)) {
            //   displayValue = `${value.dialCode} ${value.number}`;
            // }
            if (key === 'phoneNumber' && isObject(value)) {
              const phone = value as any;
              displayValue = `${phone.dialCode} ${phone.number}`;
            }
            return (
              <div key={key}>
                <p className="capitalize text-gray-600 dark:text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                <p className="font-semibold dark:text-white">{displayValue || 'N/A'}</p>
              </div>
            );
          })}
        </div>
      </div>
      <Separator className="my-3 dark:bg-gray-700" />
      <div>
        <h4 className="mb-3 text-xl font-semibold dark:text-white">Preferences</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Object.entries(pref).map(([key, value]: any) => (
            <div key={key}>
              <p className="text-lg font-bold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <div>
                {isObject(value)
                  ? Object.entries(value).map(([k, v]: any) => (
                      <div key={k} className="flex gap-2">
                        <p className="capitalize text-gray-600 dark:text-gray-400">{k.replace(/([A-Z])/g, ' $1').trim()} :</p>
                        <p className="font-semibold dark:text-white">
                          {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : v || 'N/A'}
                        </p>
                      </div>
                    ))
                  : value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ReviewBooking = ({
  flight,
  reserveActionError,
  setReserveActionError = () => {},
  formsError,
  setFormsError = () => {},
  onConfirm,
  nextStep,
}: ReviewBookingProps) => {
  const pathname = usePathname();
  const router = useRouter();

  const [pDetails, setPDetails] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any[]>([]);

  useLayoutEffect(() => {
    const passengersJSON = sessionStorage.getItem('passengersDetails') || '[]';
    const preferencesJSON = sessionStorage.getItem('passengersPreferences') || '[]';
    const passengers = JSON.parse(passengersJSON);
    const preferencesData = JSON.parse(preferencesJSON);

    if (passengersJSON === '[]' || preferencesJSON === '[]') {
      setFormsError({
        ...formsError,
        passengersDetails: {},
        passengersPreferences: {},
      });
      return;
    }

    const passengerError: any = {};
    passengers.forEach((passenger: any) => {
      const { success, errors } = validatePassengerDetails(passenger);
      if (!success) passengerError[passenger?.key] = errors;
    });

    if (Object.keys(passengerError).length > 0) {
      setFormsError({ ...formsError, passengersDetails: passengerError });
      return;
    }

    const preferenceError: any = {};
    preferencesData.forEach((preference: any) => {
      const { success, errors } = validatePassengerPreferences(preference);
      if (!success) preferenceError[preference?.key] = errors;
    });

    if (Object.keys(preferenceError).length > 0) {
      setFormsError({ ...formsError, passengersPreferences: preferenceError });
      return;
    }

    queueMicrotask(() => {
      setPDetails(passengers);
      setPreferences(preferencesData);
    });

    return () => {
      setFormsError({});
      setPDetails([]);
      setPreferences([]);
      setReserveActionError({});
    };
  }, []);

  function setProgress(step: string) {
    router.push(`${pathname}?tab=${step}`);
  }

  const hasFormsError = Object.keys(formsError || {}).length > 0;
  const hasReserveError = Object.keys(reserveActionError || {}).length > 0;
  const hasError = hasFormsError || hasReserveError;

  const primaryPassengerPhone = pDetails.find((p: any) => p.isPrimary)?.phoneNumber;

  return hasError ? (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-6 rounded-md border border-red-300 bg-red-50 p-6 shadow-sm dark:bg-red-900/20 dark:border-red-800">
      <div className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="h-6 w-6" />
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Booking Review Failed</h2>
      </div>

      {hasFormsError && (
        <>
          <p className="max-w-xl text-center text-sm text-red-700 dark:text-red-300">
            Some passenger details or preferences are missing or invalid. Please review and correct them before proceeding.
          </p>
          <div className="w-full max-w-2xl space-y-4 text-left">
            {Object.entries(formsError).map(([section, passengers]: any) => (
              <div key={section} className="rounded-md border border-red-200 bg-white p-4 shadow-sm">
                <h3 className="mb-2 text-base font-bold text-red-700">
                  {section.replace(/([A-Z])/g, ' $1').replace(/^\w/, ((c: string) => c.toUpperCase()))}
                </h3>
                <div className="space-y-3 pl-2">
                  {Object.entries(passengers).map(([passengerKey, errors]: any) => (
                    <div key={passengerKey}>
                      <p className="font-semibold text-red-600">Passenger Key: {passengerKey}</p>
                      <ul className="list-inside list-disc text-sm text-red-700">
                        {Object.entries(errors).map(([field, errorMsg]: any) => (
                          <li key={field}>
                            <span className="font-medium">
                              {field.replace(/([A-Z])/g, ' $1').replace(/^\w/, ((c: string) => c.toUpperCase()))}
                            </span>
                            : {errorMsg}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button size="lg" onClick={() => setProgress('passenger_forms')} className="bg-red-600 font-semibold text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">
            Go Back & Fix Details
          </Button>
        </>
      )}

      {hasReserveError && (
        <>
          <p className="max-w-xl text-center text-sm text-red-700 dark:text-red-300">
            {reserveActionError?.message || 'Something went wrong. Please try again.'}
          </p>
          {reserveActionError?.link && (
            <Button
              size="lg"
              className="bg-red-600 font-semibold text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              onClick={() => router.push(reserveActionError.link.href)}
            >
              {reserveActionError.link.label}
            </Button>
          )}
        </>
      )}
    </div>
  ) : (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Review Your Booking</h1>
        </div>
        <Button onClick={onConfirm} className="rounded-lg text-black">
          Reserve & Pay
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <SectionHeader title="Flight Details" />
        {flight.segmentIds.map((segment: any, index: number) => (
          <Fragment key={segment._id}>
            <FlightDetails flight={segment} />
            {index !== flight.segmentIds.length - 1 && flight.segmentIds.length > 1 && (
              <div className="w-fit self-center rounded-md bg-tertiary px-5 py-1 text-center font-bold text-white">
                Layover{' '}
                {minutesToHMFormat(
                  flight?.layovers?.find((layover: any) => +layover.fromSegmentIndex === index)?.durationMinutes
                )}
              </div>
            )}
          </Fragment>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionHeader title="Passenger Details" />
          <Button size="sm" onClick={() => setProgress('passenger_forms')} className="text-black">
            Edit Details
          </Button>
        </div>
        {pDetails.map((passenger: any, index: number) => (
          <PassengerCard
            key={passenger.key}
            passenger={passenger}
            preferences={preferences.find((p: any) => p.key === passenger.key)}
          />
        ))}
      </div>

      <div className="rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg">
        <SectionHeader title="Contact Information" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-gray-600 dark:text-gray-400">Email</p>
            <p className="font-semibold dark:text-white">{pDetails.find((p: any) => p.isPrimary)?.email}</p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400">Phone</p>
            <p className="font-semibold dark:text-white">
              {primaryPassengerPhone ? `${primaryPassengerPhone.dialCode} ${primaryPassengerPhone.number}` : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewBooking;