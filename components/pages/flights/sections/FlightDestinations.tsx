import 'server-only';
import { SectionTitle } from '@/components/SectionTitle';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { cookies } from 'next/headers';
import { addDays } from 'date-fns';
import { formatDateToYYYYMMDD } from '@/app/lib/utils';
import { getPopularFlightDestinations } from '@/app/lib/services/flights';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';

interface Airport {
  _id: string;
  iataCode: string;
  name: string;
  city: string;
  country: string;
  image?: string | null;
}

interface AirportWithRandomFrom extends Airport {
  randomFrom: Airport;
}

export const FlightDestinations = dynamic(
  () => Promise.resolve(DestinationsSection),
  {
    ssr: true,
    loading: () => <FlightDestinationLoading />,
  }
);

const DEFAULT_AIRPORT_IMAGE =
  'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop';

function isValidImageUrl(url: any): url is string {
  return typeof url === 'string' && url.length > 0 && url !== 'null' && (url.startsWith('/') || url.startsWith('http'));
}

async function DestinationsSection() {
  const popularDestinations: Airport[] = await getPopularFlightDestinations(10);
  const cookieStore = await cookies();
  const timeZone = cookieStore.get('timeZone')?.value || 'UTC';

  // Ensure all airports have required fields
  const validDestinations = popularDestinations.filter(
    (dest) => dest.iataCode && dest.name && dest.city
  );

  if (validDestinations.length === 0) {
    return null; // or show a message
  }

  // Deterministic "from" selection: pick the first other destination
  const destinationsWithRandomFrom: AirportWithRandomFrom[] = validDestinations.map((dest, index) => {
    // Use the next airport in the list as the departure, or the first one if only one exists
    const otherIndex = (index + 1) % validDestinations.length;
    const randomFrom = validDestinations[otherIndex];
    return { ...dest, randomFrom };
  });

  return (
    <section className="mx-auto">
      <div className="mx-auto mb-[20px] flex items-center justify-between max-md:flex-col max-md:gap-[16px] md:mb-[40px]">
        <SectionTitle
          title="Popular Flight Destinations"
          subTitle="Explore the world's most sought-after destinations with competitive prices"
          className="flex-[0_0_50%]"
        />
      </div>
      <div className="grid gap-[16px] sm:grid-cols-2 lg:grid-cols-4">
        {destinationsWithRandomFrom.map((destination) => {
          const searchParams = new URLSearchParams();
          searchParams.set(
            'from',
            `${destination.randomFrom.iataCode}_${destination.randomFrom.name}_${destination.randomFrom.city}`
          );
          searchParams.set(
            'to',
            `${destination.iataCode}_${destination.name}_${destination.city}`
          );
          searchParams.set('tripType', 'one_way');
          searchParams.set('desiredDepartureDate', formatDateToYYYYMMDD(addDays(new Date(), 1), timeZone));
          searchParams.set('desiredReturnDate', '');
          searchParams.set('class', 'economy');
          searchParams.set('passengers', 'adults-1_children-0_infants-0');

          const url = `/flights/search/${encodeURIComponent(searchParams.toString())}`;
          const imageSrc = isValidImageUrl(destination.image) ? destination.image : DEFAULT_AIRPORT_IMAGE;

          return (
            <Link key={destination._id} href={url} prefetch={false}>
              <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-0">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={imageSrc}
                      alt={destination.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <div className="mb-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-medium">{destination.iataCode}</span>
                      </div>
                      <h3 className="text-lg font-bold drop-shadow">
                        {destination.city}, {destination.name}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function FlightDestinationLoading() {
  return (
    <section className="mx-auto">
      <div className="mx-auto mb-[20px] flex items-center justify-between max-md:flex-col max-md:gap-[16px] md:mb-[40px]">
        <SectionTitle
          title="Popular Flight Destinations"
          subTitle="Explore the world's most sought-after destinations with competitive prices"
          className="flex-[0_0_50%]"
        />
      </div>
      <div className="grid gap-[16px] sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden dark:bg-gray-800">
            <CardContent className="p-0">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}