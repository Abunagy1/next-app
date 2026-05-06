//import { auth } from '@/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth'; // 👈 import the options
import Link from 'next/link';
import AcmeLogo from './ui/acme-logo';
import { lusitana } from './ui/fonts';
import Image from 'next/image';
import { getSortedPostsData } from '@/app/lib/posts';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { Plane, Building2, BookText, ShoppingBag } from 'lucide-react';
export const dynamic = 'force-dynamic';
export default async function Page() {
  //const session = await auth();
  const session = await getServerSession(authOptions); // 👈 use getServerSession
  const posts = await getSortedPostsData();
  const recentPosts = posts.slice(0, 3); // show latest 3 posts
  return (
    <main className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <section className="relative bg-gray-900 dark:bg-black text-white overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Left Content */}
            <div className="flex-1 text-center md:text-left">
              <AcmeLogo />
              <h1 className={`${lusitana.className} text-4xl md:text-5xl lg:text-6xl font-bold mt-6 leading-tight`}>
                Welcome to My Site
              </h1>
              <p className="text-lg md:text-xl mt-4 text-blue-50 max-w-2xl mx-auto md:mx-0">
                A dynamic Next.js application with blog, dashboard, and store – built for performance and scalability.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                {!session ? (
                  <>
                    <Link
                      href="/user/signup"
                      className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                      Get Started <ArrowRightIcon className="w-5 h-5" />
                    </Link>
                    <Link
                      href="/user/login"
                      className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 hover:scale-105 transition-all duration-200"
                    >
                      Log In
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  >
                    Go to Dashboard <ArrowRightIcon className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>

            {/* Right Image (optional) */}
            {/* Desktop Hero Image (circular) */}
            <div className="flex-1 hidden md:block">
              <div className="relative mx-auto w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96">
                <Image
                  src="/hero-desktop.jpg"   // your desktop image
                  alt="Dashboard preview"
                  fill
                  className="object-cover rounded-full shadow-2xl" // ← rounded-full makes it circular
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" fillOpacity="0.1" />
          </svg>
        </div>
      </section>
      {/* Mobile Hero Image (visible only on small screens, below the hero) */}
        {/* Mobile Hero Image (portrait rectangle) */}
        <div className="md:hidden my-8 px-4">
          <div className="relative w-full max-w-xs mx-auto aspect-[3/4]"> {/* 3:4 portrait ratio */}
            <Image
              src="/hero-mobile.jpg"   // your mobile/portrait image
              alt="Mobile app preview"
              fill
              className="object-cover rounded-2xl shadow-2xl"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
      </div>
      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gray-50 dark:bg-gray-800 rounded-3xl my-12">
        <div className="text-center mb-12">
          <h2 className={`${lusitana.className} text-3xl font-bold text-gray-900 dark:text-white`}>
            Our Services
          </h2>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Explore our range of travel and lifestyle services.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <Link href="/flights" className="group p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Plane className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Find Flights</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Search and book flights to your favorite destinations.
            </p>
          </Link>

          <Link href="/hotels" className="group p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Find Hotels</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Discover and book stays at the best hotels worldwide.
            </p>
          </Link>

          <Link href="/blog" className="group p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <BookText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Our Blog</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Read our latest travel tips and stories.
            </p>
          </Link>

          <Link href="/store" className="group p-6 bg-white dark:bg-gray-700 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Store</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Shop for premium travel gear and accessories.
            </p>
          </Link>
        </div>
      </section>
      
      {/* Recent Posts Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className={`${lusitana.className} text-3xl md:text-4xl font-bold text-gray-900 dark:text-white`}>
            Recent Posts
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4 max-w-2xl mx-auto">
            Discover the latest articles from our blog. Click on any post to read more.
          </p>
        </div>

        {recentPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post, index) => (
              <Link
                key={post.slug}
                href={`/blog/posts/${post.slug}`}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                {/* Optional image placeholder (you can replace with actual post image) */}
                <div className="h-48 bg-gradient-to-br from-blue-400 to-indigo-500 relative">
                  {post.images && post.images[0] ? (
                    <Image src={post.images[0]} alt={post.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold opacity-20">
                      {post.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mt-3 line-clamp-3">
                    {post.content.substring(0, 120)}...
                  </p>
                  <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-medium">
                    Read more <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-12">
            No posts yet. Check back soon!
          </p>
        )}
        <div className="text-center mt-12">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 hover:scale-105 transition-all duration-200 shadow-md"
          >
            View All Posts <ArrowRightIcon className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}