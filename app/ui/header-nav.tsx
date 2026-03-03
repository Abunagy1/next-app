'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';

export default function HeaderNav() {
  const pathname = usePathname();
  const hasRefreshed = useRef(false);
  const [mounted, setMounted] = useState(false);
  const { data: session, status, update } = useSession();
  // Reset refresh flag on path change
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    hasRefreshed.current = false;
  }, [pathname]);
  // Attempt to refresh session once per navigation if unauthenticated
  useEffect(() => {
    if (status === 'unauthenticated' && !hasRefreshed.current) {
      hasRefreshed.current = true;
      update();
    }
  }, [pathname, status, update]);
  // During SSR or initial hydration, show a simple placeholder
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
  if (status === 'loading') {
    return <div className="w-24 h-10 bg-gray-200 rounded animate-pulse" />;
  }
  return (
    <div className="flex items-center space-x-3">
      <Link href="/blog" className={linkClasses('/blog')}>
        Blog
      </Link>
      <Link href="/store" className={linkClasses('/store')}>
        Store
      </Link>
      {session?.user ? (
        <>
          <Link href="/dashboard" className={linkClasses('/dashboard')}>
            Dashboard
          </Link>
          {session?.user?.role === 'admin' && (
            <Link href="/store/edit" className={linkClasses('/store/edit')}>
              Edit Products
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={buttonClasses}
          >
            Sign Out
          </button>
        </>
      ) : (
        <Link href="/login" className={buttonClasses}>
          Sign In
        </Link>
      )}
    </div>
  );
}