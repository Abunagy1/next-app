import Image from 'next/image';
import { FormattedCustomersTable } from '@/app/lib/definitions';

export default async function CustomersTable({
  customers,
}: {
  customers: FormattedCustomersTable[];
}) {
  return (
    <div className="w-full">
      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-4 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300 sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Total Invoices
                    </th>
                    <th scope="col" className="px-3 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Total Pending
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-sm font-medium text-gray-500 dark:text-gray-300 sm:pr-6">
                      Total Paid
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="group hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="whitespace-nowrap px-4 py-4 text-sm sm:pl-6">
                        <div className="flex items-center gap-3">
                          <Image
                            src={customer.image_url}
                            className="rounded-full"
                            alt={`${customer.name}'s profile picture`}
                            width={32}
                            height={32}
                          />
                          <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {customer.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {customer.total_invoices}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {customer.total_pending}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-900 dark:text-white sm:pr-6">
                        {customer.total_paid}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}