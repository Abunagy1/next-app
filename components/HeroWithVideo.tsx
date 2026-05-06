'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
const rotatingPhrases = [
  'a Travel Influencing Career',
  'The ultimate travel hack',
  'A new travel career',
  'Perks for friends',
  'your fun-money fund',
  'a blowout vacation',
  'An ultimate side hustle',
  'a way to travel the world',
];
interface HeroWithVideoProps {
  isLoggedIn?: boolean;
}
export default function HeroWithVideo({ isLoggedIn = false }: HeroWithVideoProps) {
  const [currentPhrase, setCurrentPhrase] = useState(rotatingPhrases[0]);
const getStartedUrl = isLoggedIn ? '/dashboard' : '/user/signup';
const getStartedLabel = isLoggedIn ? 'Go to Dashboard' : 'Get Started Now';
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase(prev => {
        const nextIndex = (rotatingPhrases.indexOf(prev) + 1) % rotatingPhrases.length;
        return rotatingPhrases[nextIndex];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  return (
    <section className="relative text-white overflow-hidden min-h-[90vh] flex items-center">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/travel-bg.mp4" type="video/mp4" />
        {/* Fallback image if video fails */}
        <img src="/travel-bg-fallback.jpg" alt="Background" className="object-cover" />
      </video>
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center z-10">
        <div className="inline-block bg-yellow-500 text-black text-sm font-bold px-3 py-1 rounded-full mb-4">
          CYBER WEEK SALE: Get an EXTRA $25 Gift Card + an 8 Day / 7 Night Vacation
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          Transform your passion for travel
          <br />
          into <span className="text-yellow-400">{currentPhrase}</span>
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
          Earn up to 90% commission, enjoy exclusive discounts, and get top-tier training.
        </p>
        <Link
          href={getStartedUrl}
          className="inline-flex items-center gap-2 bg-yellow-500 text-black font-bold px-8 py-4 rounded-full text-lg hover:bg-yellow-400 transition"
        >
          {getStartedLabel}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-100">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">70%</span>
            <span>off hotels & cruises</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">90%</span>
            <span>commission</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">24/7</span>
            <span>support</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold">$0</span>
            <span>startup cost</span>
          </div>
        </div>
      </div>
    </section>
  );
}