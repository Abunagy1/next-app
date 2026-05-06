import { SearchStaysForm } from '@/components/sections/SearchStaysForm';

export default function HotelSearchQueryPage({ params }: { params: { hotelSearchParams: string } }) {
  return (
    <section className="mx-auto mb-8 rounded-[16px] px-[24px] py-[32px] shadow-md dark:bg-gray-800">
      <SearchStaysForm params={params} />
    </section>
  );
}