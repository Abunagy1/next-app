/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Slider } from "@/components/ui/slider";
//import { Dropdown } from "@/components/local-ui/Dropdown";
import { FilterSection } from "@/components/local-ui/FilterSection";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterRating } from "@/components/local-ui/FilterRating";
import { cn } from "@/app/lib/utils";
import { useState, useEffect, use } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setStayFilter, setStayForm, setDefaultStayFilters, resetStayFilters } from "@/reduxStore/features/stayFormSlice";
import { useRouter } from "next/navigation";
import validateHotelSearchParams from "@/app/lib/zodSchemas/hotelSearchParams";
import { jumpTo } from "@/components/local-ui/Jumper";
import { Skeleton } from "@/components/ui/skeleton";

interface HotelsFilterProps {
  className?: string;
  filters?: any;
  _hotelSearchParams?: any;
  defaultFilterValuesPromise?: Promise<any>;
}

export function HotelsFilter({ className, filters = {}, _hotelSearchParams = {}, defaultFilterValuesPromise = Promise.resolve({}) }: HotelsFilterProps) {
  const router = useRouter();
  const [filterPopup, setFilterPopup] = useState(false);
  const defaultFilterDB = use(defaultFilterValuesPromise);
  const [isFilterLoading, setIsFilterLoading] = useState(true);
  const [amenitiesLimit, setAmenitiesLimit] = useState(10);
  const [featuresLimit, setFeaturesLimit] = useState(10);
  const dispatch = useDispatch();
  const stayState = useSelector((state: any) => state.stayForm.value);
  const hotelFilterState = stayState.filters;
  const hotelDefaultFilterState = stayState.defaultFilterValues;

  useEffect(() => {
    dispatch(setDefaultStayFilters(defaultFilterDB));
    queueMicrotask(() => setIsFilterLoading(false));
    return () => {
      queueMicrotask(() => setIsFilterLoading(true));
    };
  }, [defaultFilterDB, dispatch]);

  useEffect(() => {
    dispatch(setStayFilter({
      priceRange: defaultFilterDB?.priceRange || [0, 2000],
      ...filters,
      amenities: filters?.amenities ? filters.amenities.map((el: string) => "amenity-" + el) : [],
      features: filters?.features ? filters.features.map((el: string) => "feature-" + el) : [],
    }));
  }, [filters, dispatch, defaultFilterDB?.priceRange]);

  function handleCheckboxChange(checked: boolean, groupName: string, name: string) {
    if (checked) {
      const currentGroup = stayState?.filters?.[groupName] ?? [];
      dispatch(setStayFilter({ [groupName]: [...currentGroup, name] }));
    } else {
      const currentGroup = stayState?.filters?.[groupName] ?? [];
      dispatch(setStayFilter({ [groupName]: currentGroup.filter((item: string) => item !== name) }));
    }
  }

  function handleApplyFilters() {
    // Validate current search state
    const validateStayForm = validateHotelSearchParams({
      city: stayState.destination.city,
      country: stayState.destination.country,
      checkIn: stayState.checkIn,
      checkOut: stayState.checkOut,
      rooms: stayState.rooms,
      guests: stayState.guests,
    });
    if (!validateStayForm.success) {
      dispatch(setStayForm({ errors: validateStayForm.errors }));
      return;
    }

    // Build base query from Redux state
    const baseParams: Record<string, string> = {
      city: stayState.destination.city,
      country: stayState.destination.country,
      checkIn: String(stayState.checkIn),
      checkOut: String(stayState.checkOut),
      rooms: String(stayState.rooms),
      guests: String(stayState.guests),
    };
    const sp = new URLSearchParams(baseParams);

    // Append filter parameters
    for (const [key, value] of Object.entries(hotelFilterState)) {
      if (Array.isArray(value) && value.length > 0) {
        sp.set(`filter_${key}`, value.join(','));
      }
    }

    router.replace(`/hotels/search/${encodeURIComponent(sp.toString())}`, { scroll: false });
    jumpTo("hotelResults");
  }
  function handleResetFilters() {
    dispatch(resetStayFilters());
  }
  if (isFilterLoading) return <Loading className={className} />;

  return (
    <section className={cn(
        'relative w-full border-none pr-[12px] lg:w-[400px] lg:border-r-[1px] dark:border-gray-700',
        className
      )}>
      <div className={cn("w-full rounded-lg max-lg:bg-white max-lg:p-5 max-lg:shadow-md dark:bg-gray-800", !filterPopup && "max-lg:hidden")}>
      <div className="mb-[24px] flex items-center justify-between font-semibold text-secondary">
        <Button className="p-0 text-[1.25rem] max-lg:w-full max-lg:bg-primary/30 text-gray-800 dark:text-white" variant="link" onClick={() => { if (document.body.clientWidth < 1024) setFilterPopup(!filterPopup); }} asChild><h2>Filters</h2></Button>
        <Button className="p-0 max-lg:hidden text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white" variant="link" onClick={handleResetFilters} asChild><h2>Reset Filter</h2></Button>
          {/* <button
            type="button"
            onClick={() => { if (document.body.clientWidth < 1024) setFilterPopup(!filterPopup); }}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-[48px] px-4 py-2 text-gray-800 dark:text-white hover:bg-primary/10 dark:hover:bg-primary/20"
          >
            <h2>Filters</h2>
          </button>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-[48px] px-4 py-2 max-lg:hidden underline-offset-4 hover:underline"
            style={{ color: '#4b5563' }}
          >
            Reset
          </button>       */}
      </div>
        <div className="flex justify-end">
          <Button type="button" variant="link" className="block h-auto px-0 lg:hidden text-gray-600 dark:text-gray-300" onClick={handleResetFilters}>Reset Filter</Button>
          {/* <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-[48px] px-4 py-2 lg:hidden underline-offset-4 hover:underline"
            style={{ color: '#4b5563' }}
          >
            reset filter
          </button> */}
        </div>
        <div>
          <FilterSection title="Price per night" defaultOpen={true}>
            <div className="my-5">
              <Slider
                name="hotel-price-slider"
                min={+hotelDefaultFilterState?.priceRange?.[0]}
                max={+hotelDefaultFilterState?.priceRange?.[1]}
                value={stayState.filters.priceRange}
                onValueChange={(value) => dispatch(setStayFilter({ priceRange: value }))}
              />
              <div className="mt-2 flex justify-between font-semibold">
                <span className="text-gray-800 dark:text-white">${stayState.filters.priceRange?.[0]}</span>
                <span className="text-gray-800 dark:text-white">${stayState.filters.priceRange?.[1]}</span>
              </div>
            </div>
          </FilterSection>
          <FilterSection title="Rating" defaultOpen={true}>
              <FilterRating
                value={stayState.filters.rates}
                setValue={(rate) => dispatch(setStayFilter({ rates: rate }))}
                className="justify-start"
              />
          </FilterSection>
          <FilterSection title="Features">
            <div className="flex flex-col gap-3">
              {hotelDefaultFilterState?.features.slice(0, featuresLimit).map((name: string) => {
                const IDfyName = "feature-" + name.trim();
                return <Checkbox key={IDfyName} onCheckedChange={(checked) => handleCheckboxChange(!!checked, "features", IDfyName)} name={IDfyName} id={IDfyName} label={<span className="dark:text-gray-300">{name}</span>} checked={stayState.filters.features.includes(IDfyName)} />;
              })}
              <Button type="button" variant="ghost" className="h-min w-min p-0 text-tertiary dark:text-primary dark:hover:text-primary/80" onClick={() => setFeaturesLimit(featuresLimit < hotelDefaultFilterState?.features.length ? hotelDefaultFilterState?.features.length : 10)}>
                {featuresLimit < hotelDefaultFilterState?.features.length ? `+${Math.abs(hotelDefaultFilterState?.features.length - featuresLimit)} more` : "Show less"}
              </Button>
            </div>
          </FilterSection>
          <FilterSection title="Amenities">
            <div className="flex flex-col gap-3">
              {hotelDefaultFilterState?.amenities.slice(0, amenitiesLimit).map((name: string) => {
                const IDfyName = "amenity-" + name.trim();
                return <Checkbox key={IDfyName} onCheckedChange={(checked) => handleCheckboxChange(!!checked, "amenities", IDfyName)} name={IDfyName} id={IDfyName} label={<span className="dark:text-gray-300">{name}</span>} checked={stayState.filters.amenities.includes(IDfyName)} />;
              })}
              <Button type="button" variant="ghost" className="h-min w-min p-0 text-tertiary dark:text-primary dark:hover:text-primary/80" onClick={() => setAmenitiesLimit(amenitiesLimit < hotelDefaultFilterState?.amenities.length ? hotelDefaultFilterState?.amenities.length : 10)}>
                {amenitiesLimit < hotelDefaultFilterState?.amenities.length ? `+${Math.abs(hotelDefaultFilterState?.amenities.length - amenitiesLimit)} more` : "Show less"}
              </Button>
            </div>
          </FilterSection>
          <div className="flex justify-end">
            <Button type="button" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition-colors" onClick={handleApplyFilters}>Apply</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
function Loading({ className }: { className?: string }) {
  return (
    <section className={cn("relative w-full border-none pr-[12px] lg:w-[400px] lg:border-r-[1px]", className)}>
      <div className="mb-[24px] flex items-center justify-between font-semibold text-secondary">
        <Button className="p-0 text-[1.25rem] max-lg:w-full max-lg:bg-primary/30 dark:text-white" variant="link" disabled asChild><h2>Filters</h2></Button>
      </div>
      <div className="w-full rounded-lg max-lg:bg-white max-lg:p-5 max-lg:shadow-md dark:bg-gray-800 z-10">
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-20" />
          <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}</div>
        </div>
      </div>
    </section>
  );
}