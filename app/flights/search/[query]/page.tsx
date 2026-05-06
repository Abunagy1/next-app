import { SearchFlightsForm } from '@/components/sections/SearchFlightsForm';

export default function FlightSearchQueryPage({ params }: { params: { query: string } }) {
  return (
    <section className="mx-auto mb-8 rounded-[16px] bg-white px-[24px] py-[32px] shadow-md dark:bg-gray-800">
      <SearchFlightsForm params={params} />
    </section>
  );
}