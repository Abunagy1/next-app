export default function extractFiltersObjFromSearchParams(searchParamsObj: Record<string, any>): Record<string, any> {
  const filterSearchParams = Object.entries(searchParamsObj).filter(([key]) =>
    key.startsWith('filter_')
  );
  const filters: Record<string, unknown> = {};
  filterSearchParams.forEach(([key, value]) => {
    const filterKey = key.split('filter_')[1];
    let filterValue: any = (value as string).split(',').filter(Boolean);
    if (filterKey === 'priceRange') {
      filterValue = filterValue.map((v: string) => parseInt(v, 10)).filter((v: number) => !isNaN(v));
    }
    if (filterKey === 'rates') {
      filterValue = [...new Set(filterValue)].map(String);
    }
    if (filterKey === 'features') {
      filterValue = [...new Set(filterValue)].map((el: any) => el.split('feature-')[1] || el);
    }
    if (filterKey === 'amenities') {
      filterValue = [...new Set(filterValue)].map((el: any) => el.split('amenity-')[1] || el);
    }
    if (filterValue.length > 0) {
      filters[filterKey] = filterValue;
    }
  });
  return filters;
}