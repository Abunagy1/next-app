'use client';

import ProgressStepper from '@/components/local-ui/ProgressStepper';
import { FareCard } from '@/components/FareCard';
import { useState } from 'react';
import TravelersFormsSection from './sections/TravelersFormsSection';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import ReviewBooking from './sections/ReviewBooking';
import SeatPreferencesSection from './sections/PreferencesSection';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { flightReserveAction } from '@/app/lib/actions/flightReserveAction';
import BookingPayment from './sections/BookingPayment';
// this multiSegmentCombinedFareBreakDown function has been moved to app/lib/helpers/flights/fareBreakdown.ts to avoid circular dependencies with priceCalculations.ts which is used in FareCard component and also needs to use the same fare breakdown logic for multi-segment flights
//import { multiSegmentCombinedFareBreakDown } from '@/app/lib/db/schema/flightItineraries';
// it will be imported from fareBreakdown.ts instead which itself imports the singleSegmentFareBreakdown function from priceCalculations.ts without causing circular dependency issues since priceCalculations.ts does not import anything from fareBreakdown.ts
import { multiSegmentCombinedFareBreakDown } from '@/app/lib/helpers/flights/fareBreakdown';

interface BookingStepsProps {
  flight: any;
  metaData: any;
  searchStateObj: any;
}

export default function BookingSteps({ flight, metaData, searchStateObj }: BookingStepsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = searchParams.get('tab');

  const [formsError, setFormsError] = useState<any>({});
  const [reserveActionError, setReserveActionError] = useState<any>({});

  const { passengers: passengersObj } = searchStateObj;
  const passengerCountObj = {
    adult: passengersObj.adults,
    child: passengersObj.children,
    infant: passengersObj.infants,
  };

  const { fareBreakdowns, total: computedTotal } = multiSegmentCombinedFareBreakDown(
    flight.segmentIds,
    passengerCountObj,
    metaData.flightClass
  );

  function showErrorToast(message: string) {
    toast.error(message);
  }

  async function savePassengersDetails(e: any) {
    e.target.disabled = true;
    const passengersDetails = sessionStorage.getItem('passengersDetails') || '[]';
    const passengersPreferences = sessionStorage.getItem('passengersPreferences') || '[]';

    if (passengersDetails === '[]') {
      showErrorToast('Please fill all the details in passengers details form first');
      sessionStorage.removeItem('passengersDetails');
      sessionStorage.removeItem('passengersPreferences');
      e.target.disabled = false;
      return;
    }

    if (passengersPreferences === '[]') {
      showErrorToast('Please fill all the details in passengers preferences form first');
      sessionStorage.removeItem('passengersPreferences');
      e.target.disabled = false;
      return;
    }

    const formData = new FormData();
    formData.append('passengersDetails', passengersDetails);
    formData.append('passengersPreferences', passengersPreferences);
    formData.append(
      'metaData',
      JSON.stringify({
        flightNumber: flight.flightCode,
        date: flight.date,
        fareBreakdowns,
        totalPrice: computedTotal,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    );

    const res = await flightReserveAction(undefined, formData);
    if (res?.success === true) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      sessionStorage.removeItem('passengersDetails');
      sessionStorage.removeItem('passengersPreferences');
      router.push(`${pathname}?tab=payment`);
    } else {
      if (res.errors) setFormsError(res.errors);
      if (res.message) {
        if (
          res.message ===
          'You have already reserved a flight of this flight number. Please cancel it or cofirm it first to book another flight'
        ) {
          setReserveActionError({
            ...res,
            link: {
              href: `${pathname}?tab=payment`,
              label: 'Pay previous booking',
            },
          });
        }
        showErrorToast(res.message);
      }
    }
    e.target.disabled = false;
  }

  function setPassengersDetailsError(err: any) {
    setFormsError((prev: any) => ({ ...prev, passengersDetails: err }));
  }

  function renderComponent(tab: string | null) {
    switch (tab) {
      case 'passenger_forms':
        return (
          <TravelersFormsSection
            errors={formsError?.passengersDetails}
            setErrors={setPassengersDetailsError}
            passengersCountObj={passengersObj}
            primaryPassengerEmail={metaData.userEmail}
            flightClass={metaData.flightClass}
            departureDate={new Date(flight.date)}
            nextStep="passenger_preferences"
          />
        );
      case 'passenger_preferences':
        return <SeatPreferencesSection nextStep="review" />;
      case 'review':
        return (
          <ReviewBooking
            reserveActionError={reserveActionError}
            setReserveActionError={setReserveActionError}
            formsError={formsError}
            setFormsError={setFormsError}
            flight={flight}
            onConfirm={savePassengersDetails}
            nextStep="payment"
          />
        );
      case 'payment':
        return (
          <BookingPayment
            flightNumber={flight.flightCode}
            flightDateTimestamp={new Date(flight.date).getTime()}
          />
        );
      default:
        return (
          <TravelersFormsSection
            errors={formsError?.passengersDetails}
            setErrors={setPassengersDetailsError}
            passengersCountObj={passengersObj}
            primaryPassengerEmail={metaData.userEmail}
            flightClass={metaData.flightClass}
            departureDate={new Date(flight.date)}
            nextStep="passenger_preferences"
          />
        );
    }
  }

  const bookingSteps = [
    { label: 'Passengers', value: 'passenger_forms' },
    { label: 'Preferences', value: 'passenger_preferences' },
    { label: 'Review', value: 'review' },
    { label: 'Payment', value: 'payment' },
  ];

  return (
    <>
      <ProgressStepper
        className="my-5"
        steps={bookingSteps}
        currentStepValue={tab || 'passenger_forms'}
        onCurrentValueChange={(value: string) => {
          router.push(`${pathname}?tab=${value}`);
        }}
      />
      <div className="flex gap-5 max-lg:flex-col">
        <div className="w-full">
          {renderComponent(tab)}
          <Separator className="dark:bg-gray-700" />
        </div>
        <div className="flex-grow">
          <div className="h-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
            <h3 className="mb-3 text-2xl font-bold dark:text-white">Fare Summary</h3>
            <FareCard
              className="p-0 shadow-none dark:bg-transparent"
              segments={flight.segmentIds}
              passengersCountObj={passengerCountObj}
              flightClass={metaData.flightClass}
            />
          </div>
        </div>
      </div>
    </>
  );
}