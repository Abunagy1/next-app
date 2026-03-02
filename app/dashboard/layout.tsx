// This page file is to creates and control the UI layout that is shared between multiple Dashboard routes. 
// because Dashboard have some sort of navigations that is shared across multiple pages,
// Like Invoces, Customers, so subbranched routs has different seperated pages, that must
// have another (page) file for each route content other than the main ones in app folder
// all those pages files will be controlled here to create the UI for those routes.
import { SessionProvider } from 'next-auth/react';
// Any components you import into this file will be part of the layout.
// So the next Sidenav component weill be part of the layout.
import SideNav from '@/app/ui/dashboard/sidenav'; // importing the <SideNav /> component into your layout.
// The Next <Layout /> component receives a children prop -- same as the main app layout RootLayout component file.
// This child can either be a page.tsx or another layout.tsx from different kind of other routes (SideNav is not a prob)
// The prob in this case will the pages inside /dashboard, that will automatically be nested inside a <Layout />.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="w-full flex-none md:w-64">
          <SideNav />
        </div>
        <div className="grow p-6 md:overflow-y-auto md:p-12 text-gray-900 dark:text-gray-100">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}