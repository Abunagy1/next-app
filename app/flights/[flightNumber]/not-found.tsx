import Link from 'next/link';
import { Button } from '@/components/ui/button';
import routes from '@/data/routes.json'; // adjust path if needed
export default function FlightNotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-100 px-4 text-center dark:bg-gray-900">
      <h1 className="text-9xl font-extrabold text-primary drop-shadow-xl">404</h1>
      <p className="mt-4 text-2xl font-semibold text-gray-700 dark:text-gray-200">
        Flight Not Found
      </p>
      <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
        Sorry, the flight you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s take you back flight search.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href={routes.flights.path}>Back to Flights</Link>
        </Button>
      </div>
    </div>
  );
}