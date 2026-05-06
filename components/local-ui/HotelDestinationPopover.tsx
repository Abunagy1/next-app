'use client';
import { ApiSearchInputPopover } from './ApiSearchInputPopover';
import Image from 'next/image';
import { cn, objDeepCompare } from '@/app/lib/utils';
import locationIcon from '@/public/travel/icons/location.svg';  // corrected path
import { Skeleton } from '@/components/ui/skeleton';

interface Destination {
  city: string;
  country: string;
  type?: string;
}

interface HotelDestinationPopoverProps {
  isLoading?: boolean;
  className?: string;
  fetchInputs: any;
  defaultSelected: Destination;
  excludeVals: Destination[];
  getSelected?: (selected: Destination) => void;
}

export function HotelDestinationPopover({
  isLoading,
  className,
  fetchInputs,
  defaultSelected,
  excludeVals,
  getSelected = () => {},
}: HotelDestinationPopoverProps) {
function renderSelectedResult(obj: Destination) {
  if (isLoading) {
    return (
      <div className={cn('rounded border p-2', className)}>
        <Skeleton className="mb-2 h-8 w-[130px]" />
        <Skeleton className="h-4 w-[100px]" />
      </div>
    );
  }
  const hasValidCity = obj?.city && !['Select a City', 'City', 'A City', ''].includes(obj.city);
  return (
    <div className={cn('rounded border p-2 dark:border-gray-600 dark:bg-gray-800', className)}>
      <div className="text-2xl font-bold dark:text-white">
        {hasValidCity ? obj.city : 'Select destination'}
      </div>
      <div className="text-sm dark:text-gray-400">
        {hasValidCity ? obj.country : ''}
      </div>
    </div>
  );
}

  function renderSearchResults(
    result: any,
    setOpen: (open: boolean) => void,
    setSelected: (selected: Destination) => void
  ) {
    if (result.success === false) {
      return (
        <div className="flex h-full items-center justify-center p-2 text-center text-sm font-bold">
          {result.message}
        </div>
      );
    }
    const filteredResultArr = result.data.filter((obj: Destination) => {
      return !excludeVals.some((exObj) => objDeepCompare(obj, exObj));
    });
    if (filteredResultArr.length === 0) {
      return (
        <div className="flex h-full items-center justify-center p-2 text-center text-sm font-bold">
          No results found
        </div>
      );
    }
    return filteredResultArr.map((obj: Destination, i: number) => (
      <div
        onClick={() => {
          setSelected(obj);
          setOpen(false);
        }}
        key={i}
        className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-muted dark:border-gray-700 dark:hover:bg-gray-700"
      >
        <Image width={24} height={24} src={locationIcon} alt="location_icon" className="dark:invert" />
        <div>
          <div className="text-md font-bold dark:text-white">{obj.city}</div>
          <div className="text-xs dark:text-gray-400">{obj.country}</div>
        </div>
      </div>
    ));
  }

  return (
    <ApiSearchInputPopover
      isLoading={isLoading}
      fetchInputs={fetchInputs}
      defaultSelected={defaultSelected}
      renderSelectedResult={renderSelectedResult}
      renderSearchResults={renderSearchResults}
      getSelectedResult={getSelected}
    />
  );
}