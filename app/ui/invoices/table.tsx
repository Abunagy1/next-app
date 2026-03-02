import Image from 'next/image';
import { UpdateInvoice, DeleteInvoice } from '@/app/ui/invoices/buttons';
import InvoiceStatus from '@/app/ui/invoices/status';
import { formatDateToLocal, formatCurrency } from '@/app/lib/utils';
import { fetchFilteredInvoices } from '@/app/lib/data';
// <Table> Component, you'll see that the two props,
// query and currentPage, are passed to the fetchFilteredInvoices() function which returns the invoices that match the query.
export default async function InvoicesTable({
  query,
  currentPage,
  userCustomerIds,
  isAdmin,
}: {
  query: string;
  currentPage: number;
  userCustomerIds?: string[];
  isAdmin: boolean;
}) {
  const invoices = await fetchFilteredInvoices(query, currentPage, userCustomerIds, isAdmin);
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0 dark:bg-gray-900">
          <div className="md:hidden">
            {invoices?.map((invoice) => (
            <div key={invoice.id} className="mb-2 w-full rounded-md bg-white p-4 dark:bg-gray-800">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <div className="mb-2 flex items-center">
                    <Image
                      src={invoice.image_url}
                      className="mr-2 rounded-full"
                      width={28}
                      height={28}
                      alt={`${invoice.name}'s profile picture`}
                    />
                    <p className="text-gray-900 dark:text-gray-100">{invoice.name}</p> {/* explicit */}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.email}</p>
                </div>
                <InvoiceStatus status={invoice.status} />
              </div>
              <div className="flex w-full items-center justify-between pt-4">
                <div>
                  <p className="text-xl font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(invoice.amount)}
                  </p>
                  <p className="text-gray-900 dark:text-gray-100">{formatDateToLocal(invoice.date)}</p> {/* explicit */}
                </div>
                <div className="flex justify-end gap-2">
                  <UpdateInvoice id={invoice.id} />
                  <DeleteInvoice id={invoice.id} />
                </div>
              </div>
            </div>
            ))}
          </div>
          <table className="hidden min-w-full text-gray-900 dark:text-gray-100 md:table">
            <thead className="rounded-lg text-left text-sm font-normal">
              <tr>
                <th scope="col" className="px-4 py-5 font-medium sm:pl-6">
                  Customer
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Email
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Amount
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Date
                </th>
                <th scope="col" className="px-3 py-5 font-medium">
                  Status
                </th>
                <th scope="col" className="relative py-3 pl-6 pr-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800">
              {invoices?.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="w-full border-b border-gray-200 dark:border-gray-700 py-3 text-sm last:border-none hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex items-center gap-3">
                    <Image
                      src={invoice.image_url}
                      className="rounded-full"
                      width={28}
                      height={28}
                      alt={`${invoice.name}'s profile picture`}
                    />
                      <p className="text-gray-900 dark:text-gray-100">{invoice.name}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-500 dark:text-gray-400">
                    {invoice.email}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-900 dark:text-gray-100">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-900 dark:text-gray-100">
                    {formatDateToLocal(invoice.date)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <InvoiceStatus status={invoice.status} />
                  </td>
                  <td className="whitespace-nowrap py-3 pl-6 pr-3">
                    <div className="flex justify-end gap-3">
                      <UpdateInvoice id={invoice.id} />
                      <DeleteInvoice id={invoice.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
