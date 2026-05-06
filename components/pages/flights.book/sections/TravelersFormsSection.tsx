'use client';
import { Dropdown } from '@/components/local-ui/Dropdown';
import TravelerDetailsForm from './TravelerDetailsForm';
import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import validatePassengerDetails from '@/app/lib/zodSchemas/passengerDetailsValidation';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function TravelersFormsSection({
  errors,
  setErrors = () => {},
  primaryPassengerEmail,
  passengersCountObj,
  nextStep,
  metaData,
}: any) {
  let travelerCount = 0;
  const PASSENGER_TYPE_PLACEHOLDERS: Record<string, string> = {
    adults: 'Adult',
    children: 'Child',
    infants: 'Infant',
  };
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  // ── New: wrapped navigation that NEVER moves if there are errors ──
  const attemptNextStep = () => {
    const passengersDetailsErrors: any = {};
    const raw = sessionStorage.getItem('passengersDetails') || '[]';
    const pParsed = JSON.parse(raw);

    if (!pParsed.length) {
      toast.error('Please fill in all passenger details before continuing.');
      return;
    }

    pParsed.forEach((value: any) => {
      const { success, errors: e } = validatePassengerDetails(value);
      if (success === false) {
        passengersDetailsErrors[value.key] = e;
      }
    });

    if (Object.keys(passengersDetailsErrors).length > 0) {
      setErrors(passengersDetailsErrors);
      toast.error('Some required fields are missing or invalid. Please check the form.');
      return;              // ← STOPS HERE – no navigation
    }

    // All good → navigate
    router.push(`${pathname}?tab=${nextStep}`);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold dark:text-white">
          Enter Passenger Details
        </h3>
        <Button
          type="button"
          className="dark:bg-primary dark:hover:bg-primary/80 dark:text-white"
          onClick={attemptNextStep}
        >
          Continue
        </Button>
      </div>
      {loading ? (
        <div className="flex h-[300px] w-full items-center justify-center rounded-lg bg-white shadow-lg dark:bg-gray-800">
          <Loader2Icon className="animate-spin" />
        </div>
      ) : (
        Object.entries(passengersCountObj).map(([passengerType, quantity]) => {
          return Array.from({ length: quantity as number }).map((_) => {
            travelerCount++;
            const key = `${PASSENGER_TYPE_PLACEHOLDERS[passengerType]}-${travelerCount}`;
            return (
              <Dropdown
                defaultOpen={true}
                classNames={{
                  parent: 'bg-white dark:bg-gray-800 rounded-md shadow-lg',
                  content: 'p-6 dark:bg-gray-800',
                  trigger: '',
                }}
                key={key}
                title={
                  <div className="text-xl font-bold dark:text-white">
                    Traveler {travelerCount}&nbsp; ({PASSENGER_TYPE_PLACEHOLDERS[passengerType]}){' '}
                    <span className="text-sm text-gray-500">
                      {travelerCount === 1 ? '( Primary )' : ''}
                    </span>
                  </div>
                }
              >
                <TravelerDetailsForm
                  errors={
                    errors?.[key]
                      ? Object.keys(errors[key]).length > 0
                        ? errors[key]
                        : undefined
                      : undefined
                  }
                  className="p-0 shadow-none"
                  travelerType={PASSENGER_TYPE_PLACEHOLDERS[passengerType]}
                  travelerCount={travelerCount}
                  primaryTraveler={travelerCount === 1}
                  primaryPassengerEmail={
                    travelerCount === 1 ? primaryPassengerEmail : ''
                  }
                  metaData={metaData}
                />
              </Dropdown>
            );
          });
        })
      )}
      <div className="flex justify-end">
        <Button
          type="button"
          className="dark:bg-primary dark:hover:bg-primary/80 dark:text-white"
          onClick={attemptNextStep}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}