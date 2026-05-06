import { SearchStaysForm } from '@/components/sections/SearchStaysForm';

export default function HotelSearchLayout({
  children,
  hotelFilter,
  hotelResult,
}: {
  children: React.ReactNode;
  hotelFilter: React.ReactNode;
  hotelResult: React.ReactNode;
}) {
  return (
    <main className="w-[90%] my-10 mx-auto">
      <section className="mx-auto mb-8 rounded-[16px] px-[24px] py-[32px] shadow-md dark:bg-gray-800">
        {children}
      </section>
      <section className="mx-auto flex w-full flex-col justify-center gap-[24px] lg:flex-row">
        {hotelFilter}
        {hotelResult}   
      </section>
    </main>
  );
}