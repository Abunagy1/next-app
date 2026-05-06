import { HotelResultCard } from '@/components/pages/hotels.search/ui/HotelResultCard';

interface FavouriteHotelsSectionProps {
  favouriteHotels: any[];
}

export function FavouriteHotelsSection({ favouriteHotels }: FavouriteHotelsSectionProps) {
  if (favouriteHotels.length < 1) {
    return (
      <h1 className="h-full rounded-md bg-white py-20 text-center text-[1.25rem] font-semibold text-secondary shadow-md dark:bg-gray-800 dark:text-white">
        No favourite flights
      </h1>
    );
  }

  return (
    <div className={'mb-5 grid grid-cols-1 gap-[16px] sm:max-md:grid-cols-2'}>
      {favouriteHotels.map((hotel, i) => {
        return <HotelResultCard key={hotel._id} hotel={hotel} />;
      })}
    </div>
  );
}