// 'use client';
// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { cn } from '@/app/lib/utils';
// import Countdown from './Countdown';
// interface SessionTimeoutCountdownProps {
//   redirectionLink: string;
//   className?: string;
//   jumpToId?: string;
// }
// export default function SessionTimeoutCountdown({
//   redirectionLink,
//   className,
//   jumpToId,
// }: SessionTimeoutCountdownProps) {
//   // Lazy initializer – reads localStorage once during initial render
//   const [sessionTimeout, setSessionTimeout] = useState<number | null>(() => {
//     if (typeof window === 'undefined') return null;
//     const timeout = localStorage.getItem('sessionTimeoutAt');
//     return timeout ? parseInt(timeout, 10) : null;
//   });
//   // Lazy initializer – gets current timestamp onces
//   const [currentTime] = useState(() => Date.now());
//   const router = useRouter();
//   useEffect(() => {
//     // Only set up event listener for storage changes (no setState call here)
//     const handleStorage = (e: StorageEvent | CustomEvent) => {
//       if ('key' in e && e.key === 'sessionTimeoutAt') {
//         setSessionTimeout(parseInt((e as any).newValue, 10));
//       }
//     };
//     window.addEventListener('customStorage', handleStorage as EventListener);
//     window.addEventListener('storage', handleStorage);
//     return () => {
//       window.removeEventListener('customStorage', handleStorage as EventListener);
//       window.removeEventListener('storage', handleStorage);
//     };
//   }, []);
//   if (!sessionTimeout || sessionTimeout < currentTime) return null;
//   return (
//     <div className={cn('bg-yellow-100 p-3 text-center text-sm font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', className)} suppressHydrationWarning>
//       Your session will expire in <Countdown currentTimeMs={currentTime} timeoutAtMs={sessionTimeout} />.{' '}
//       <button
//         onClick={() => {
//           if (jumpToId) document.getElementById(jumpToId)?.scrollIntoView({ behavior: 'smooth' });
//           router.push(redirectionLink);
//         }}
//         className="underline"
//       >
//         Click here to search again
//       </button>
//     </div>
//   );
// }

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import Countdown from './Countdown';
interface SessionTimeoutCountdownProps {
  redirectionLink: string;
  className?: string;
  jumpToId?: string;
}
export default function SessionTimeoutCountdown({
  redirectionLink,
  className,
  jumpToId,
}: SessionTimeoutCountdownProps) {
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<number>(0);
  useEffect(() => {
    const timeout = localStorage.getItem('sessionTimeoutAt');
    if (timeout) {
      queueMicrotask(() => setSessionTimeout(parseInt(timeout, 10)));
    }
    queueMicrotask(() => setCurrentTime(Date.now()));

    const handleStorage = (e: any) => {
      if (e.key === 'sessionTimeoutAt') {
        setSessionTimeout(parseInt(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  // On the server and before local storage loads, show an empty container
  if (sessionTimeout === null) {
    return <div className={className} suppressHydrationWarning />;
  }
  if (sessionTimeout < currentTime) return null;
  return (
      <div
        className={cn(
          'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-3 text-center text-sm font-medium text-gray-800 dark:text-gray-200',
          className
        )}
        suppressHydrationWarning
      >
      Your session will expire in{' '}
      <Countdown
        currentTimeMs={currentTime}
        timeoutAtMs={sessionTimeout}
        className="font-semibold"
      />
      {' '}
      <button
        onClick={() => {
          if (jumpToId) document.getElementById(jumpToId)?.scrollIntoView({ behavior: 'smooth' });
          router.push(redirectionLink);
        }}
        className="underline text-amber-900 dark:text-yellow-400 dark:hover:text-yellow-300">
        Click here to search again
      </button>
    </div>
  );
}