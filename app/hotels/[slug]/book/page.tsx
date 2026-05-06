// app/(pages)/hotels/[slug]/book/page.tsx
import { BreadcrumbUI } from '@/components/local-ui/breadcrumb';
import { AuthenticationCard } from '@/components/AuthenticationCard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import NotFound from '@/app/not-found';
import routes from '@/data/routes.json';
import { HotelBookingSteps } from '@/components/pages/hotels.book/HotelBookingSteps';
import { getHotel } from '@/app/lib/services/hotels';
import validateHotelSearchParams from '@/app/lib/zodSchemas/hotelSearchParams';
import { getUserDetails } from '@/app/lib/services/user';

export default async function HotelBookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const loggedIn = !!session?.user?.id;

  if (!loggedIn) {
    return (
      <main className="mx-auto my-12 w-[95%] text-secondary">
        {/* @ts-ignore */}
        <AuthenticationCard />
      </main>
    );
  }

  const cookieStore = await cookies();
  const searchStateRaw = cookieStore.get('hotelSearchState')?.value || '{}';
  const searchState = JSON.parse(searchStateRaw);
  const validate = validateHotelSearchParams(searchState);

  if (!validate.success) {
    return (
      <NotFound
        whatHappened="Error in search state"
        explanation="Sorry, we couldn't retrieve your hotel search context or there was an error in search state. Thus we couldn't retrieve the hotel details. Please search again."
        navigateTo={{ path: routes.hotels.path, title: routes.hotels.title }}
      />
    );
  }

  const hotelDetails = await getHotel(slug, searchState);
  if (!hotelDetails || Object.keys(hotelDetails).length === 0) notFound();

  const userDetails = await getUserDetails(session.user.id);
  if (!userDetails) {
    return (
      <NotFound
        whatHappened="User not found"
        explanation="Your account could not be found. Please log in again."
        navigateTo={{ path: routes.login.path, title: 'Log In' }}
      />
    );
  }

  // Safely extract user details for the booking steps
  const userInfo = {
    firstName: userDetails.firstName || '',
    lastName: userDetails.lastName || '',
    email: userDetails.email || '',
    phone: userDetails.phoneNumbers?.[0] || { dialCode: '', number: '' },
  };

  return (
    <main className="mx-auto my-12 w-[95%] text-secondary">
      <BreadcrumbUI />
      <HotelBookingSteps
        hotelDetails={hotelDetails}
        searchState={searchState}
        userDetails={userInfo}
      />
    </main>
  );
}