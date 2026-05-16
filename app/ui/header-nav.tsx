// 'use client';
// import { useEffect, useRef, useState } from 'react';
// import Link from 'next/link';
// import { useSession, signOut } from 'next-auth/react';
// import { usePathname } from 'next/navigation';
// export default function HeaderNav() {
//   const { data: session, status, update } = useSession();
//   const pathname = usePathname();
//   const hasRefreshed = useRef(false);
//   //const [mounted] = useState(() => typeof window !== 'undefined');
//   const [mounted, setMounted] = useState(false);
//   useEffect(() => {
//     queueMicrotask(() => setMounted(true));
//   }, []);
//   useEffect(() => {
//     hasRefreshed.current = false;
//   }, [pathname]);
//   useEffect(() => {
//     if (status === 'unauthenticated' && !hasRefreshed.current) {
//       hasRefreshed.current = true;
//       update();
//     }
//   }, [pathname, status, update]);
//   if (!mounted) return null;

//   // Unified base classes for links and buttons
//   const baseClasses = `
//     px-3 py-1.5 rounded-md text-sm font-medium transition-colors
//     whitespace-nowrap
//   `;
//   // if (!mounted) {
//   //   return <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />;
//   // }
//   const linkClasses = (href: string) => {
//     const isActive = pathname === href;
//     return `${baseClasses} ${
//       isActive
//         ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
//         : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
//     }`;
//   };
//   const buttonClasses = `${baseClasses} bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100`;
//   const isLoggedIn = !!session?.user;
//   const isAdmin = session?.user?.role === 'admin';
//   const isTravelPage = pathname === '/travel';
//   return (
//     <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-3">
//       {/* Always visible: Blog and Store */}
//       <Link href="/blog" className={linkClasses('/blog')}>Blog</Link>
//       <Link href="/store" className={linkClasses('/store')}>Store</Link>
//       <Link href="/travel" className={linkClasses('/travel')}>Travel</Link>
//       {/* Travel‑only links (appear only when on /travel) */}
        // {!isLoggedIn && (
        //   <Link
        //     href="/user/signup"
        //     className={linkClasses('/user/signup')}
        //     title="Sign In"
        //   >
        //     <UserIcon className="h-5 w-5" />
        //     <span className="md:hidden">Sign In</span>
        //   </Link>
        // )}
//       {isTravelPage && (
//         <>
//           <Link href="/flights" className={linkClasses('/flights')}>Flights</Link>
//           <Link href="/hotels" className={linkClasses('/hotels')}>Hotels</Link>
//           {isLoggedIn && (
//             <>
//               <Link href="/user/favourites" className={linkClasses('/user/favourites')}>
//                 Favourites
//               </Link>
//               <Link href="/user/my_bookings" className={linkClasses('/user/my_bookings')}>
//                 My Bookings
//               </Link>
//             </>
//           )}
//         </>
//       )}
//       {/* Dashboard – appears always & shown for logged‑in users */}
//       {isLoggedIn && (
//         <Link href="/dashboard" className={linkClasses('/dashboard')}>Dashboard</Link>
//       )}
//       {/* Contact button – visible for non‑authenticated OR logged‑in non‑admin */}
//       {(!isLoggedIn || (isLoggedIn && !isAdmin)) && (
//         <Link href="/contact" className={buttonClasses}>Send Me</Link>
//       )}
//       {/* Admin-only link */}
//       {isLoggedIn && isAdmin && (
//         <Link href="/store/edit" className={linkClasses('/store/edit')}>Edit Products</Link>
//       )}
//       {/* Sign Out – only for logged-in users */}
//       {isLoggedIn && (
//         <button
//           onClick={() => signOut({ callbackUrl: '/' })}
//           className={buttonClasses}
//         >
//           Sign Out
//         </button>
//       )}
//     </div>
//   );
// }

'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function HeaderNav() {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const hasRefreshed = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    hasRefreshed.current = false;
  }, [pathname]);

  useEffect(() => {
    if (status === 'unauthenticated' && !hasRefreshed.current) {
      hasRefreshed.current = true;
      update();
    }
  }, [pathname, status, update]);

  if (!mounted) return null;

  // Determine if the current page belongs to the travel section
  const travelPaths = ['/flights', '/hotels', '/user/my_bookings', '/user/favourites', '/travel'];
  const isTravelSection = travelPaths.some(p => pathname.startsWith(p));

  const baseClasses = `
    px-3 py-1.5 rounded-md text-sm font-medium transition-colors
    whitespace-nowrap
  `;
  const linkClasses = (href: string) => {
    const isActive = pathname === href;
    return `${baseClasses} ${
      isActive
        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;
  };

  const buttonClasses = `${baseClasses} bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100`;

  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === 'admin';

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-1">
      {/* Always visible core links */}
      <Link href="/blog" className={linkClasses('/blog')}>Blog</Link>
      <Link href="/store" className={linkClasses('/store')}>Store</Link>
      <Link href="/travel" className={linkClasses('/travel')}>Travel</Link>

      {/* Travel‑section links – shown on any travel‑related page */}
      {/* {isTravelSection && (
        <>
          <Link href="/flights" className={linkClasses('/flights')}>Flights</Link>
          <Link href="/hotels" className={linkClasses('/hotels')}>Hotels</Link>
          {isLoggedIn && (
            <>
              <Link href="/user/favourites" className={linkClasses('/user/favourites')}>Favourites</Link>
              <Link href="/user/my_bookings" className={linkClasses('/user/my_bookings')}>My Bookings</Link>
            </>
          )}
        </>
      )} */}
      {!isLoggedIn && (
        <Link
          href="/user/login"
          className={linkClasses('/user/login')}
          title="Login"
        >
          <UserIcon className="h-5 w-5" />
          <span className="md:hidden">Login</span>
        </Link>
      )}

      {isTravelSection && (
        <>
          <Link href="/flights" className={linkClasses('/flights')}>Flights</Link>
          <Link href="/hotels" className={linkClasses('/hotels')}>Hotels</Link>
          {isLoggedIn && (
            <>
              <Link href="/user/favourites" className={linkClasses('/user/favourites')}>Favourites</Link>
              <Link href="/user/my_bookings" className={linkClasses('/user/my_bookings')}>My Bookings</Link>
            </>
          )}
        </>
      )}
      {/* Dashboard – always for logged‑in users */}
      {isLoggedIn && (
        <Link href="/dashboard" className={linkClasses('/dashboard')}>Dashboard</Link>
      )}

      {/* Contact button (Send Me) */}
      {(!isLoggedIn || (isLoggedIn && !isAdmin)) && (
        <Link href="/contact" className={buttonClasses}>Send Me</Link>
      )}

      {/* Admin‑only link */}
      {/* {isLoggedIn && isAdmin && (
        <Link href="/store/edit" className={linkClasses('/store/edit')}>Edit Products</Link>
      )} */}
      {isLoggedIn && isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger className={buttonClasses}>
            Admin
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
          >
            <DropdownMenuItem asChild>
              <Link href="/store/edit">Edit Products</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin/add-flight">Add Flight</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin/add-hotel">Add Hotel</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/admin/add-airport">Add Airport</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {isLoggedIn && (
        <>
          <Link href="/user/profile" className={linkClasses('/user/profile')}>
            Profile
          </Link>
          <Link href="/user/settings" className={linkClasses('/user/settings')}>Settings</Link>
        </>
      )}
      {/* Sign Out */}
      {isLoggedIn && (
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className={buttonClasses}
        >
          Sign Out
        </button>
      )}
    </div>
  );
}