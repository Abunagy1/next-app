import 'server-only';
import { SectionTitle } from '@/components/SectionTitle';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { addDays } from 'date-fns';
import { getPopularHotelDestination } from '@/app/lib/services/hotels';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

interface HotelDestination {
  _id: string;
  address?: {
    city?: string;
    country?: string;
  };
  image?: string | null;
  category?: string;
}

export const PopularHotelDestinations = dynamic(
  () => Promise.resolve(DestinationsSection),
  {
    ssr: true,
    loading: () => <HotelDestinationLoading />,
  }
);
// Use this if destination.image is falsy
const DEFAULT_HOTEL_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop';

function isValidImageUrl(url: any): url is string {
  return typeof url === 'string' && url.length > 0 && url !== 'null' && (url.startsWith('/') || url.startsWith('http'));
}

async function DestinationsSection() {
  const hotelDestinations: HotelDestination[] = await getPopularHotelDestination(10);
  const cookieStore = await cookies();
  const timeZone = cookieStore.get('timeZone')?.value || 'UTC';

  return (
    <section>
      <div className="mx-auto mb-[20px] flex items-center justify-between max-md:flex-col max-md:gap-[16px] md:mb-[40px]">
        <SectionTitle
          title="Popular Hotel Destinations"
          subTitle="Explore the most sought-after destinations for hotel stays. From tropical beaches to urban centers, discover where travelers love to stay."
          className="flex-[0_0_50%]"
        />
      </div>
      <div className="grid gap-[16px] sm:grid-cols-2 lg:grid-cols-4">
        {hotelDestinations.map((destination) => {
          // Skip destinations with missing address data
          if (!destination.address?.city || !destination.address?.country) {
            return null;
          }
          // const city = destination.address?.city ?? 'Unknown City';
          // const country = destination.address?.country ?? 'Unknown Country';
          const city = destination.address.city;
          const country = destination.address.country;
          const image = isValidImageUrl(destination.image) ? destination.image : DEFAULT_HOTEL_IMAGE;
          const category = destination.category ?? 'Hotel';

          const cityCountry = `${city}, ${country}`;
          const checkIn = addDays(new Date(), 2);
          const checkOut = addDays(new Date(), 3);
          const createSearchParams = new URLSearchParams();
          createSearchParams.set('city', city);
          createSearchParams.set('country', country);
          createSearchParams.set('checkIn', checkIn.getTime().toString());
          createSearchParams.set('checkOut', checkOut.getTime().toString());
          createSearchParams.set('rooms', '1');
          createSearchParams.set('guests', '1');
          const url = `/hotels/search/${encodeURIComponent(createSearchParams.toString())}`;
          return (
            <Link key={destination._id} href={url} prefetch={false}>
              <Card className="overflow-hidden transition-all hover:shadow-lg dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-0">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={image}
                      alt={`hotel_image_${city}_${country}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                    <Badge variant="secondary" className="absolute right-2 top-2 dark:bg-gray-700 dark:text-gray-200">
                      {category}
                    </Badge>
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="text-lg font-bold text-white drop-shadow">
                        {cityCountry}
                      </h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        }).filter(Boolean)} 
      </div>
    </section>
  );
}

function HotelDestinationLoading() {
  return (
    <section className="mx-auto">
      <div className="mx-auto mb-[20px] flex items-center justify-between max-md:flex-col max-md:gap-[16px] md:mb-[40px]">
        <SectionTitle
          title="Popular Hotel Destinations"
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