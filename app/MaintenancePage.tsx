'use client';
import { useEffect, useState } from 'react';
import { Loader, MailIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface MaintenancePageProps {
  message?: string;
  startsAt?: number;
  endsAt?: number;
}

export default function MaintenancePage({ message, startsAt, endsAt }: MaintenancePageProps) {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!endsAt) return;
    const endTime = new Date(endsAt);
    const updateCountdown = () => {
      const now = new Date();
      const diff = endTime.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown('Maintenance is ending soon.');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const parts: string[] = []; // ✅ explicit type
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (seconds > 0) parts.push(`${seconds}s`);
      setCountdown(parts.join(' ') || '0s');
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  return (
    <main className="mx-auto flex min-h-screen w-[95%] items-center justify-center sm:w-[90%]">
      <div className="my-[40px] flex min-h-[80%] grow items-center justify-center rounded-[20px] bg-primary/30 px-4 py-12 text-primary-foreground dark:bg-primary/20">
        <div className="relative w-full max-w-lg rounded-2xl border border-primary/20 bg-primary p-8 text-center shadow-xl backdrop-blur-md dark:bg-gray-800 dark:border-gray-700">
          <div className="absolute left-1/2 top-[-30px] flex h-[60px] w-[60px] -translate-x-1/2 items-center justify-center rounded-full bg-white">
            <svg width="233" height="212" viewBox="0 0 233 212" fill="#8DD3BB" xmlns="http://www.w3.org/2000/svg" className="h-[40px] w-[40px] transition-all hover:fill-[#112211]">
              <path fillRule="evenodd" clipRule="evenodd" d="M183.982 67.9131C171..." />
            </svg>
          </div>
          <div className="mb-4 mt-8 flex flex-col items-center gap-2">
            <Loader className="animate-spin text-secondary" size={48} />
            <h1 className="text-4xl font-bold text-white dark:text-gray-100">Scheduled Maintenance</h1>
          </div>
          <p className="mb-5 text-lg font-bold text-secondary dark:text-gray-300">
            {message || "We're performing essential updates to improve your experience. Please check back soon."}
          </p>
          {countdown && (
            <div className="mb-4 space-y-1 text-sm text-secondary dark:text-gray-300">
              <p className="text-xl font-bold text-black dark:text-white">Estimated maintenance ends in:</p>
              <p className="mx-auto w-fit rounded-md bg-white p-2 text-xl font-bold text-black dark:text-white">
                {countdown}
              </p>
            </div>
          )}
          <div className="mt-6 flex justify-center">
            <Button asChild className="bg-secondary px-6 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/90 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">
              <Link href="/support">
                <MailIcon className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}