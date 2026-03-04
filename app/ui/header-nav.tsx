'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function HeaderNav() {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const hasRefreshed = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted) {
    return <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />;
  }

  const linkClasses = (href: string) => {
    const isActive = pathname === href;
    return `px-4 py-2.5 rounded-md text-lg font-medium transition-colors ${
      isActive
        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    }`;
  };

  const buttonClasses = `px-4 py-2.5 rounded-md text-lg font-medium transition-colors bg-blue-500 hover:bg-blue-600 text-white`;

  const isLoggedIn = !!session?.user;
  const isAdmin = session?.user?.role === 'admin';

  return (
    <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-3">
      {/* Always visible: Blog and Store */}
      <Link href="/blog" className={linkClasses('/blog')}>Blog</Link>
      <Link href="/store" className={linkClasses('/store')}>Store</Link>

      {/* Dashboard – appears right after Store for all logged-in users */}
      {isLoggedIn && (
        <Link href="/dashboard" className={linkClasses('/dashboard')}>Dashboard</Link>
      )}

      {/* Contact button – visible for non‑authenticated OR logged‑in non‑admin */}
      {(!isLoggedIn || (isLoggedIn && !isAdmin)) && (
        <Link href="/contact" className={buttonClasses}>Send Me</Link>
      )}

      {/* Admin-only link */}
      {isLoggedIn && isAdmin && (
        <Link href="/store/edit" className={linkClasses('/store/edit')}>Edit Products</Link>
      )}

      {/* Sign Out – only for logged-in users */}
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