'use client';

import { cn } from '@/app/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Counter from './Counter';
import { ErrorMessage } from './errorMessage';
import { Skeleton } from '@/components/ui/skeleton';
import { useDispatch } from 'react-redux';
import { setFlightForm } from '@/reduxStore/features/flightFormSlice';
import { useState, useCallback } from 'react';

interface FlightFormData {
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
  class: 'economy' | 'premium_economy' | 'business' | 'first';
  [key: string]: any;
}

interface FlightPassengerAndClassSelectorProps {
  flightFormData: FlightFormData;
  errors?: {
    passengers?: string;
    class?: string;
  };
  isLoading?: boolean;
}

export default function FlightPassengerAndClassSelector({
  flightFormData,
  errors,
  isLoading,
}: FlightPassengerAndClassSelectorProps) {
  const dispatch = useDispatch();
  const classPlaceholders: Record<string, string> = {
    economy: 'Economy',
    premium_economy: 'Premium Economy',
    business: 'Business',
    first: 'First class',
  };
  const [isOpen, setIsOpen] = useState(false);

  const totalPassenger = useCallback(() => {
    return Object.values(flightFormData.passengers).reduce((a, b) => a + b, 0);
  }, [flightFormData.passengers]);

  const handleClassChange = useCallback(
    (value: string) => {
      dispatch(
        setFlightForm({
          ...flightFormData,
          class: value as FlightFormData['class'],
        })
      );
    },
    [dispatch, flightFormData]
  );

  const handleAdultsChange = useCallback(
    (count: number) => {
      dispatch(
        setFlightForm({
          passengers: {
            ...flightFormData.passengers,
            adults: count,
          },
        })
      );
    },
    [dispatch, flightFormData.passengers]
  );

  const handleChildrenChange = useCallback(
    (count: number) => {
      dispatch(
        setFlightForm({
          passengers: {
            ...flightFormData.passengers,
            children: count,
          },
        })
      );
    },
    [dispatch, flightFormData.passengers]
  );

  const handleInfantsChange = useCallback(
    (count: number) => {
      dispatch(
        setFlightForm({
          passengers: {
            ...flightFormData.passengers,
            infants: count,
          },
        })
      );
    },
    [dispatch, flightFormData.passengers]
  );

  return (
    <Popover open={isOpen} onOpenChange={(open) => !isLoading && setIsOpen(open)}>
      <PopoverTrigger asChild className="max-h-[100px] min-h-[100px] w-full justify-start rounded-lg p-4">
        <div>
          {isLoading ? (
            <>
              <Skeleton className="mb-2 h-8 w-[130px]" />
              <Skeleton className="h-4 w-[100px]" />
            </>
          ) : (
            <>
              <div className="text-xl font-bold dark:text-white">
                {`${totalPassenger()} ${totalPassenger() > 1 ? 'people' : 'person'}`}
              </div>
              <div className="text-md font-medium dark:text-gray-400">
                {classPlaceholders[flightFormData.class]}
              </div>
            </>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-3 sm:w-[400px]">
        <Card className={cn('mb-3 border-2 border-primary p-3 dark:bg-gray-800 dark:border-gray-600', errors?.class && 'border-destructive')}>
          <CardHeader className="mb-4 p-0">
            <CardTitle>Class</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <FlightClassRadioGroup defaultValue={flightFormData.class} getValue={handleClassChange} />
            {errors?.class && <ErrorMessage message={errors.class} />}
          </CardContent>
        </Card>
        <Card className={cn('border-2 border-primary p-3 dark:bg-gray-800 dark:border-gray-600', errors?.passengers && 'border-destructive')}>
          <CardHeader className="mb-4 p-0">
            <CardTitle className="dark:text-white">Travelers</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 p-0">
            <TravelersCounts
              travelerType="Adults"
              defaultCount={flightFormData.passengers.adults}
              description="12 years and older"
              minCount={1}
              maxCount={9}
              getTravelersCount={handleAdultsChange}
            />
            <TravelersCounts
              travelerType="Children"
              description="2 - 11 years"
              defaultCount={flightFormData.passengers.children}
              minCount={0}
              maxCount={8}
              getTravelersCount={handleChildrenChange}
            />
            <TravelersCounts
              defaultCount={flightFormData.passengers.infants}
              travelerType="Infants"
              description="Under 2 years"
              minCount={0}
              maxCount={4}
              getTravelersCount={handleInfantsChange}
            />
            {errors?.passengers && <ErrorMessage message={errors.passengers} />}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}

interface TravelersCountsProps {
  travelerType: string;
  description: string;
  defaultCount: number;
  minCount: number;
  maxCount: number;
  getTravelersCount: (count: number) => void;
}

function TravelersCounts({
  travelerType,
  description,
  defaultCount,
  minCount,
  maxCount,
  getTravelersCount,
}: TravelersCountsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between">
      <div>
        <p className="text-sm font-bold dark:text-gray-200">{travelerType}</p>
        <p className="text-xs dark:text-gray-400">{description}</p>
      </div>
      <Counter
        defaultCount={defaultCount}
        maxCount={maxCount}
        minCount={minCount}
        getCount={getTravelersCount}
      />
    </div>
  );
}

interface FlightClassRadioGroupProps {
  defaultValue: string;
  getValue: (value: string) => void;
}

function FlightClassRadioGroup({ defaultValue, getValue }: FlightClassRadioGroupProps) {
  return (
    <RadioGroup onValueChange={(value) => getValue(value)} className="flex flex-wrap gap-3" defaultValue={defaultValue} value={defaultValue}>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="economy" id="economy" />
        <Label htmlFor="economy" className="dark:text-gray-300">Economy</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="premium_economy" id="premium_economy" />
        <Label htmlFor="premium_economy" className="dark:text-gray-300">Premium Economy</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="business" id="business" />
        <Label htmlFor="business" className="dark:text-gray-300">Business</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="first" id="first" />
        <Label htmlFor="first" className="dark:text-gray-300">First Class</Label>
      </div>
    </RadioGroup>
  );
}