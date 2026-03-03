//nav-links.tsx is not a special file name for Next.js — it can be named whatever you want
'use client'; // this Directive is important to -->
// to turn nav-links.tsx into a Client Component to be able to use the hooks like usePathname().
/* Since usePathname() is a React hook, you'll need to turn nav-links.tsx into a Client Component.
By Adding React's "use client" directive to the top of the file, then import usePathname() from next/navigation: */
import { useSession } from 'next-auth/react';
import { UserGroupIcon, HomeIcon, DocumentDuplicateIcon, UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
// the next imported Link component from NEXT/link is to be able to 
// link between pages in your application w/o full page refreshment 
// <Link> allows you to do client-side navigation with JavaScript w/o refresh the page
import Link from 'next/link';
// next line is show the active links to indicate to the user what page they are currently on
import { usePathname } from 'next/navigation';
// use the clsx library to conditionally apply class names for CSS styling, when the link is active. 
// When link.href matches the pathname, the link should be displayed with blue text and a light blue background.
import clsx from 'clsx';
export default function NavLinks() {
  // assign the path to a variable called pathname inside your <NavLinks /> component:
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  // Determine if we are on a dashboard page
  //const isDashboard = pathname.startsWith('/dashboard');
  // Home link goes to '/' when the path starts with dashboard, 
  //const homeHref = isDashboard ? '/' : '/dashboard';
  // If we're exactly on /dashboard, go to homepage; otherwise go to /dashboard
  const homeHref = pathname === '/dashboard' ? '/' : '/dashboard';
  // Map of links to display in the side navigation.
  // Depending on the size of the application, this would be stored in a database.
  const links = [
    { name: 'Home', href: homeHref, icon: HomeIcon },
    { name: 'Invoices', href: '/dashboard/invoices', icon: DocumentDuplicateIcon,   },
    { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
    { name: isAdmin ? 'API' : 'My Services', href: isAdmin ? '/dashboard/api' : '/dashboard/services',  icon: UserGroupIcon },
    { name: 'Posts', href: '/dashboard/posts', icon: DocumentDuplicateIcon }, // new
    { name: 'Profile', href: '/dashboard/profiles', icon: UserIcon },
  ];
  if (isAdmin) {
    links.push({ name: 'Admin', href: '/dashboard/admin', icon: ShieldCheckIcon });
  }
  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        const isActive = pathname === link.href;
        return (
          // here is the link used regularly as it was <a key=... > ...</a> and replaced with Link Component as below
          // Link component is similar to using <a> tags, but instead of <a href="…">, you use <Link href="…">.
          <Link
            key={link.name}
            href={link.href}
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3 dark:bg-gray-800 dark:hover:bg-sky-900 dark:hover:text-sky-300',
              {
                'bg-sky-100 text-blue-600 dark:bg-sky-900 dark:text-sky-300': isActive,
                'text-gray-700 dark:text-gray-300': !isActive, // explicit color for inactive links
              },
            )}    //When link.href matches the pathname, the link should be displayed with blue text and a light blue background.
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link>
        );
      })}
    </>
  );
}
