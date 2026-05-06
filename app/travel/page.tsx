// app/travel/page.tsx

import HeroWithVideo from '../../components/HeroWithVideo';
import PopupManager from '../../components/PopupManager';
import {
  CheckCircleIcon,
  StarIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  TruckIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { SearchFlightsAndStaysFormShortcut } from '@/components/pages/home/sections/SearchFlightsAndStaysFormShortcut';
import { FlightDestinations } from '@/components/pages/flights/sections/FlightDestinations';
import { PopularHotelDestinations } from '@/components/pages/hotels/sections/PopularHotelDestinations';
import { Reviews } from '@/components/pages/home/sections/Reviews';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Travel Agency Program | Become a Travel Influencer',
  description:
    'Transform your passion for travel into a rewarding career. Earn up to 90% commission, enjoy exclusive discounts, and get top-tier training.',
};

export default async function TravelPage() {
  const session = await getServerSession(authOptions);
  const isLoggedIn = !!session?.user;
  const getStartedUrl = isLoggedIn ? '/dashboard' : '/user/signup';

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section with Video */}
      <HeroWithVideo isLoggedIn={isLoggedIn} />
      <PopupManager />

      {/* Quick Search Form (Flights & Hotels) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <SearchFlightsAndStaysFormShortcut className="bg-white dark:bg-gray-800 rounded-xl shadow-lg" />
      </div>

      {/* Popular Flight Destinations */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FlightDestinations />
        </div>
      </section>

      {/* Popular Hotel Destinations */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PopularHotelDestinations />
        </div>
      </section>

      {/* Features Grid: "Your Travel Agency In A Box™" */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Your Travel Agency In A Box™
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to succeed, all in one place.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg text-center">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <GlobeAltIcon className="w-8 h-8 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Booking Platform
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                All-in-one booking platform, client management, and CLIA number included.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg text-center">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AcademicCapIcon className="w-8 h-8 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Top Tools & Training
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Learn from industry experts with comprehensive training library and webinars.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg text-center">
              <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CurrencyDollarIcon className="w-8 h-8 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Earn Money $$$
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Earn up to 90% commission and unlimited cash referrals. Your ultimate side hustle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            It&apos;s As Easy As:
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">1</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Sign Up
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Join our community of travel influencers.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">2</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Get Trained
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Access our industry-leading training library.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">3</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                Start Earning
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Book trips, earn commissions, and travel the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Access the Best Savings
              </h2>
              <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Up to 70% off hotels, cruises, and more</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Earn up to 90% commission on every booking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Free familiarization trips (FAM) through preferred partners</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Exclusive travel perks and upgrades</span>
                </li>
              </ul>
            </div>
            <div className="relative h-96 rounded-xl overflow-hidden shadow-xl">
              <Image
                src="https://images.pexels.com/photos/2387873/pexels-photo-2387873.jpeg?auto=compress&cs=tinysrgb&w=1600"
                alt="Travel benefits"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* Partner Logos */}
      <section className="py-12 border-y border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-6">
            Partnered with top travel brands
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <BuildingOfficeIcon className="w-8 h-8" />
              <span className="text-sm font-medium">Expedia</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <BuildingOfficeIcon className="w-8 h-8" />
              <span className="text-sm font-medium">Marriott</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <TruckIcon className="w-8 h-8" />
              <span className="text-sm font-medium">Royal Caribbean</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <ShieldCheckIcon className="w-8 h-8" />
              <span className="text-sm font-medium">Delta</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            What our Agents Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="flex gap-1 text-yellow-500 mb-2">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                &quot;Very easy to navigate. I love the platform!&quot;
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                - Vashanna F., AL
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="flex gap-1 text-yellow-500 mb-2">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                &quot;Good. It look good. I&apos;m very satisfied.&quot;
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                - undefined U.
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl">
              <div className="flex gap-1 text-yellow-500 mb-2">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                &quot;Benjamin was so helpful. I&apos;m already making money!&quot;
              </p>
              <p className="font-semibold text-gray-900 dark:text-white">
                - DeLois F.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {isLoggedIn ? 'Continue Your Journey' : 'Ready to transform your passion for travel into $$$?'}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {isLoggedIn
              ? 'Access your dashboard to manage bookings, favorites, and more.'
              : 'Join thousands of successful travel influencers. Start today!'}
          </p>
          <Link
            className="inline-flex items-center gap-2 bg-yellow-500 text-black font-bold px-8 py-4 rounded-full text-lg hover:bg-yellow-400 transition"
            href={getStartedUrl}
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Get Started Now'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
      {/* Customer Reviews */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reviews />
        </div>
      </section>
    </div>
  );
}