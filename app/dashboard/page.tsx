import { auth } from '@/auth';
import { Suspense } from 'react';
import CardWrapper from '@/app/ui/dashboard/cards';
import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
import UserInvoiceCards from '@/app/ui/dashboard/user-invoice-cards'; // new component
import { lusitana } from '@/app/ui/fonts';
import { RevenueChartSkeleton, LatestInvoicesSkeleton, CardsSkeleton } from '@/app/ui/skeletons';
import { getUserCustomerIds } from '@/app/lib/data';

export default async function Page() {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';

  let userCustomerIds: string[] = [];
  if (!isAdmin && session?.user?.id) {
    userCustomerIds = await getUserCustomerIds(session.user.id);
  }

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-2xl md:text-3xl text-gray-900 dark:text-white`}>
        Dashboard
      </h1>

      {isAdmin ? (
        // Admin view: full dashboard
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Suspense fallback={<CardsSkeleton />}>
              <CardWrapper />
            </Suspense>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
            <Suspense fallback={<RevenueChartSkeleton />}>
              <RevenueChart />
            </Suspense>
            <Suspense fallback={<LatestInvoicesSkeleton />}>
              <LatestInvoices />
            </Suspense>
          </div>
        </>
      ) : (
        // Regular user view
        <div className="space-y-6">
          <Suspense fallback={<div className="text-gray-500">Loading your stats...</div>}>
            <UserInvoiceCards userCustomerIds={userCustomerIds} />
          </Suspense>
          <div>
            <h2 className={`${lusitana.className} text-xl mb-4`}>Your Recent Invoices</h2>
            <Suspense fallback={<LatestInvoicesSkeleton />}>
              {/* Pass userCustomerIds (could be empty) */}
              <LatestInvoices userCustomerIds={userCustomerIds} />
            </Suspense>
          </div>
        </div>
      )}
    </main>
  );
}