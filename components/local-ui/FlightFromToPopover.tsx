'use client';
import { ApiSearchInputPopover } from './ApiSearchInputPopover';
import { cn, objDeepCompare } from '@/app/lib/utils';
import Image from 'next/image';
import planeIcon from '@/public/travel/icons/airplane-filled.svg';
import { Skeleton } from '@/components/ui/skeleton';
interface Airport {
  iataCode: string;
  name: string;
  city: string;
}
interface FlightFromToPopoverProps {
  className?: string;
  fetchInputs: any;
  defaultSelected: Airport;
  excludeVals: Airport[];
  isLoading?: boolean;
  getSelected?: (selected: Airport) => void;
}
export function FlightFromToPopover({
  className,
  fetchInputs,
  defaultSelected,
  excludeVals,
  isLoading,
  getSelected = () => {},
}: FlightFromToPopoverProps) {
  function renderSelectedResult(obj: Airport) {
    if (isLoading)
      return (
        <div className={cn('rounded border p-2 dark:border-gray-600 dark:bg-gray-800', className)}>
          <Skeleton className="mb-2 h-8 w-[130px]" />
          <Skeleton className="h-4 w-[100px]" />
        </div>
      );
    if (obj && Object.keys(obj).length > 0) {
      return (
        <div className={cn('rounded border p-2 dark:border-gray-600 dark:bg-gray-800', className)}>
          <div className="text-2xl font-bold dark:text-white">{obj.city}</div>
          <div className="text-sm dark:text-gray-400">{obj.name}</div>
        </div>
      );
    }
    return (
      <div className={cn('rounded border p-2 dark:border-gray-600 dark:bg-gray-800', className)}>
        <div className="text-2xl font-bold dark:text-white">City</div>
        <div className="text-sm dark:text-gray-400">Airport name</div>
      </div>
    );
  }
  function renderSearchResults(
    result: any,
    setOpen: (open: boolean) => void,
    setSelected: (selected: Airport) => void
  ) {
    if (result.success === false) {
      return (
        <div className="flex h-full items-center justify-center p-2 text-center text-sm font-bold">
          {result.message}
        </div>
      );
    }
    const filteredResultArr = result.data.filter((obj: Airport) => {
      return !excludeVals.some((exObj) => objDeepCompare(obj, exObj));
    });
    if (filteredResultArr.length === 0) {
      return (
        <div className="flex h-full items-center justify-center p-2 text-center text-sm font-bold">
          No results found
        </div>
      );
    }
    return filteredResultArr.map((obj: Airport, i: number) => (
      <div
        onClick={() => {
          setSelected(obj);
          setOpen(false);
        }}
        key={i}
        className="flex cursor-pointer items-center gap-2 rounded-md border p-2 hover:bg-muted dark:border-gray-700 dark:hover:bg-gray-700">
        <div>
          <Image
            width={24}
            height={24}
            src={planeIcon}
            alt="location_icon"
            className="min-h-6 min-w-6 dark:invert"
          />
        </div>
        <div className="flex-1">
          <div className="text-md font-bold dark:text-white">{obj.city}</div>
          <div className="text-xs dark:text-gray-400">{obj.name}</div>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-600 dark:text-gray-300">{obj.iataCode}</div>
        </div>
      </div>
    ));
  }

  return (
    <ApiSearchInputPopover
      className={cn(className)}
      isLoading={isLoading}
      fetchInputs={fetchInputs}
      defaultSelected={defaultSelected}
      getSelectedResult={getSelected}
      renderSelectedResult={renderSelectedResult}
      renderSearchResults={renderSearchResults}
    />
  );
}