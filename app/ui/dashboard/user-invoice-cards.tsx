import { fetchUserInvoiceStats } from '@/app/lib/data';
import { lusitana } from '@/app/ui/fonts';
import { BanknotesIcon, ClockIcon, InboxIcon } from '@heroicons/react/24/outline';

export default async function UserInvoiceCards({ userCustomerIds }: { userCustomerIds: string[] }) {
  const stats = await fetchUserInvoiceStats(userCustomerIds);

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Invoices Card */}
      <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</h3>
          <InboxIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
        <p className={`${lusitana.className} mt-2 text-2xl font-semibold text-gray-900 dark:text-white`}>
          {stats.numberOfInvoices}
        </p>
      </div>

      {/* Collected Card */}
      <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Collected</h3>
          <BanknotesIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
        <p className={`${lusitana.className} mt-2 text-2xl font-semibold text-gray-900 dark:text-white`}>
          {stats.totalPaid}
        </p>
      </div>

      {/* Pending Card */}
      <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</h3>
          <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
        </div>
        <p className={`${lusitana.className} mt-2 text-2xl font-semibold text-gray-900 dark:text-white`}>
          {stats.totalPending}
        </p>
      </div>
    </div>
  );
}