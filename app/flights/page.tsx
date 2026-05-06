import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { SearchFlightsForm } from '@/components/sections/SearchFlightsForm';
import { FlightDestinations } from '@/components/pages/flights/sections/FlightDestinations';
import { getRecentSearches } from '@/app/lib/services';
import { RecentSearches } from '@/components/sections/RecentSearches';
export const dynamic = 'force-dynamic';
export default async function FlightsPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user?.id;
  const recentSearches = isLoggedIn
    ? await getRecentSearches(session.user.id, 'flight', 10)
    : [];
  return (
    <>
      <header>
        <section className="relative flex h-[600px] items-center bg-flight-header bg-cover bg-no-repeat px-[5%] sm:px-[20%]">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
          <div className="mt-20 max-w-md sm:max-w-lg self-start text-white drop-shadow-lg">
            <h1 className="mb-2 text-3xl font-bold leading-tight sm:text-5xl">
              Make your travel wishlist, we&apos;ll do the rest
            </h1>
            <p className="text-base font-medium sm:text-xl text-white/90">
              Special offers to suit your plan
            </p>
          </div>
        </section>
        <div className="relative mx-auto w-[90%] -translate-y-[20%] rounded-[16px] bg-white px-[24px] pb-[48px] pt-[32px] shadow-md sm:-translate-y-[30%] dark:bg-gray-800">
          <div className="text-lg font-semibold text-secondary dark:text-white">Where are you flying?</div>
          <SearchFlightsForm />
        </div>
      </header>
      <main className="mx-auto mb-10 w-[90%] space-y-10 md:mb-20 md:space-y-20">
        {isLoggedIn && <RecentSearches searchesArr={recentSearches} />}
        <FlightDestinations />
      </main>
    </>
  );
}