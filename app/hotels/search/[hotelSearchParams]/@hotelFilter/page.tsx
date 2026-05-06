import { HotelsFilter } from '@/components/pages/hotels.search/sections/HotelsFilter';
import { getHotelDefaultFilterValues } from '@/app/lib/services/hotels';
import extractFiltersObjFromSearchParams from '@/app/lib/helpers/hotels/extractFiltersObjFromSearchParams';
import validateHotelSearchFilter from '@/app/lib/zodSchemas/hotelSearchFilterValidation';

export default async function HotelFilterPage({
  params,
}: {
  params: Promise<{ hotelSearchParams: string }>;
}) {
  const { hotelSearchParams } = await params;
  const decodedSp = decodeURIComponent(hotelSearchParams);
  const spObj = Object.fromEntries(new URLSearchParams(decodedSp));
  const filtersParams = extractFiltersObjFromSearchParams(spObj);
  const validatedFilters = validateHotelSearchFilter(filtersParams);
  const defaultFilterValuesPromise = getHotelDefaultFilterValues();

  return (
    <HotelsFilter
      filters={validatedFilters?.data || {}}
      _hotelSearchParams={spObj}
      defaultFilterValuesPromise={defaultFilterValuesPromise}
    />
  );
}