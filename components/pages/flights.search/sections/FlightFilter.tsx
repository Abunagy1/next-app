'use client';
import { Slider } from '@/components/ui/slider';
//import { Dropdown } from '@/components/local-ui/Dropdown';
import { FilterSection } from '@/components/local-ui/FilterSection';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FilterRating } from '@/components/local-ui/FilterRating';
import { cn } from '@/app/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import {
  setFlightFormFilters,
  setDefaultFlightFilters,
  resetFilters,
} from '@/reduxStore/features/flightFormSlice';
import { useRouter } from 'next/navigation';
import routes from '@/data/routes.json';
import { jumpTo } from '@/components/local-ui/Jumper';
// inside component, memoize defaultFilterObj
import { useEffect, useState } from 'react'; // useMemo
interface FlightsFilterProps {
  filters: any;
  defaultFilterObj: any;
  query: string;
  className?: string;
}
export function FlightsFilter({ filters, defaultFilterObj, query, className }: FlightsFilterProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const flightState = useSelector((state: any) => state.flightForm.value);
  const flightFilterState = flightState.filters;
  const defaultFilterState = flightState.defaultFilterValues;
  const [filterPopup, setFilterPopup] = useState(false);
  const airlineFullName: Record<string, string> = {
    EK: 'Emirates',
    EY: 'Etihad',
    FZ: 'Fly Dubai',
  };
  
// ...
// const stableDefaultFilterObj = useMemo(() => defaultFilterObj, [JSON.stringify(defaultFilterObj)]);

// useEffect(() => {
//   dispatch(setDefaultFlightFilters({ ...defaultFilterState, ...stableDefaultFilterObj }));
// }, [stableDefaultFilterObj, dispatch]);

// // Similarly for filters:
// const stableFilters = useMemo(() => filters, [JSON.stringify(filters)]);
// useEffect(() => {
//   dispatch(setFlightFormFilters({
//     priceRange: stableDefaultFilterObj.priceRange,
//     ...stableFilters,
//   }));
// }, [stableFilters, stableDefaultFilterObj.priceRange, dispatch]);
  
  useEffect(() => {
    dispatch(
      setDefaultFlightFilters({
        ...defaultFilterState,
        ...defaultFilterObj,
      })
    );
  }, [JSON.stringify(defaultFilterObj)]);

  useEffect(() => {
    dispatch(
      setFlightFormFilters({
        priceRange: defaultFilterObj.priceRange,
        ...filters,
      })
    );
  }, [JSON.stringify(filters)]);

  function handleCheckboxChange(checked: boolean, groupName: string, name: string) {
    if (checked) {
      dispatch(
        setFlightFormFilters({
          [groupName]: [...flightFilterState[groupName], name],
        })
      );
    } else {
      dispatch(
        setFlightFormFilters({
          [groupName]: flightFilterState[groupName].filter((item: string) => item !== name),
        })
      );
    }
  }
  function minToHHMM(min: number, ampm: boolean = false) {
    const hours = Math.floor(min / 60) % 24;
    const minutes = Math.floor(min % 60);
    if (!ampm) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    const hours12 = hours % 12;
    const hours12String = hours12 === 0 ? 12 : hours12;
    return `${hours12String.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${amOrPm(hours)}`;
  }
  function amOrPm(hour: number) {
    return hour >= 12 ? 'pm' : 'am';
  }
  function handleApplyFilter() {
    const searchParams = new URLSearchParams(decodeURIComponent(query));
    for (const [key, value] of Object.entries(flightFilterState)) {
      if (Array.isArray(value) && value.length) {
        searchParams.set('filter_' + key, value.join(','));
      } else {
        searchParams.delete('filter_' + key);
      }
    }
    const url = `${routes['flights-search'].path}/${encodeURIComponent(searchParams.toString())}`;
    router.replace(url, { scroll: false });
    jumpTo('flightResult');
  }
  return (
    <section className={cn(
        'relative w-full border-none pr-[12px] lg:w-[400px] lg:border-r-[1px] dark:border-gray-700 text-gray-800 dark:text-gray-200',
        className
      )}>
        <div className={cn('w-full max-lg:rounded-xl max-lg:bg-white max-lg:p-5 max-lg:shadow-md dark:bg-gray-800 z-10', filterPopup === false && 'max-lg:hidden')}>
        <div className="mb-[24px] flex items-center justify-between font-semibold">
        <Button type="button" className="p-0 text-[1.25rem] max-lg:w-full max-lg:bg-primary/30 text-gray-800 dark:text-white dark:hover:bg-primary/20" variant="link" onClick={() => { if (document.body.clientWidth < 1024) setFilterPopup(!filterPopup); }} asChild><h2>Filters</h2></Button>
        <Button type="button" className="p-0 max-lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white" variant="link" onClick={() => dispatch(resetFilters())} asChild><h2>Reset Filter</h2></Button>
          {/* className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-[48px] px-4 py-2 text-gray-800 dark:text-white hover:bg-primary/10 dark:hover:bg-primary/20 underline-offset-4 hover:underline" */}
          {/* className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-[48px] px-4 py-2 max-lg:hidden underline-offset-4 hover:underline" */}
          </div>
        <div className="flex justify-end">
          <Button type="button" variant="link" className="block h-auto px-0 lg:hidden text-gray-600 dark:text-gray-300" onClick={() => dispatch(resetFilters())}>Reset Filter</Button>
          </div>
        <div>
          <FilterSection title="Price" defaultOpen={true}>
            <div className="my-5">
              <Slider
                name="price-slider"
                min={defaultFilterState.priceRange[0]}
                max={defaultFilterState.priceRange[1]}
                value={flightFilterState.priceRange}
                onValueChange={(value) => {
                  dispatch(setFlightFormFilters({ priceRange: value as [number, number] }));
                }}
              />
              <div className="mt-3 flex justify-between text-sm font-medium text-gray-700 dark:text-gray-400">
                <p>${flightFilterState?.priceRange[0]}</p>
                <p>${flightFilterState?.priceRange[1]}</p>
              </div>
              {/* 
              <div className="mt-3 flex justify-between">
                <p className="dark:text-white">${flightFilterState?.priceRange[0]}</p>
                <p className="dark:text-white">${flightFilterState?.priceRange[1]}</p>
              </div>
              */}
            </div>
          </FilterSection>
          <FilterSection title="Departure Time" defaultOpen={true}>
            <div className="my-5">
              <Slider
                name="departure-time-slider"
                min={defaultFilterState.departureTime[0]}
                max={defaultFilterState.departureTime[1]}
                value={flightFilterState.departureTime}
                onValueChange={(value) => {
                  dispatch(setFlightFormFilters({ departureTime: value as [number, number] }));
                }}
              />
              <div className="mt-3 flex justify-between text-sm font-medium text-gray-700 dark:text-gray-400">
                <p>
                  {minToHHMM(flightFilterState?.departureTime[0] / 1000 / 60, true)}
                </p>
                <p>
                  {minToHHMM(flightFilterState?.departureTime[1] / 1000 / 60, true)}
                </p>
              </div>
            </div>
          </FilterSection>
          <FilterSection title="Rating" defaultOpen={true}>
            <div className="pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <FilterRating
              value={flightFilterState.rates}
              setValue={(rates) => {
                dispatch(setFlightFormFilters({ rates }));
              }}
              className="justify-start"
            /></div>
          </FilterSection>
          <FilterSection title="Airlines" defaultOpen={true}>
            <div className="flex flex-col gap-3">
              {defaultFilterState.airlines.map((name: string) => (
                <Checkbox
                  key={name}
                  onCheckedChange={(checked) => handleCheckboxChange(!!checked, 'airlines', name)}
                  name={name}
                  id={name}
                  label={<span className="dark:text-gray-300">{airlineFullName[name] || name}</span>}
                  checked={flightFilterState.airlines.includes(name)}
                />
              ))}
            </div>
          </FilterSection>
          <div className="flex w-full justify-end py-4 ">
            <Button onClick={handleApplyFilter} type="button" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition-colors">
              Apply
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}