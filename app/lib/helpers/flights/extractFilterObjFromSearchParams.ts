export default function extractFilterObjFromSearchParams(searchParams: string): Record<string, any> {
  const decoded = decodeURIComponent(searchParams);
  const pObj = Object.fromEntries(new URLSearchParams(decoded));
  const filterSearchParams = Object.entries(pObj).filter(([key]) =>
    key.startsWith('filter_')
  );
  const filters: Record<string, any> = {};
  filterSearchParams.forEach(([key, value]) => {
    const filterKey = key.split('filter_')[1];
    let filterValue: any = (value as string).split(',').filter(Boolean);
    if (filterKey === 'priceRange' || filterKey === 'departureTime') {
      filterValue = filterValue.map((v: string) => parseInt(v, 10)).filter((v: number) => !isNaN(v));
    }
    if (filterKey === 'rates') {
      filterValue = [...new Set(filterValue)].map(String);
    }
    if (filterValue.length > 0) {
      filters[filterKey] = filterValue;
    }
  });
  return filters;
}