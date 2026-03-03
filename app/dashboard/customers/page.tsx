//import { auth } from '@/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

import { Suspense } from 'react';
import Search from '@/app/ui/search';
import CustomersTable from '@/app/ui/customers/table';
import Pagination from '@/app/ui/invoices/pagination'; // reuse the same Pagination component
import { lusitana } from '@/app/ui/fonts';
import { fetchFilteredCustomersForUserPaginated, getUserCustomerIds, fetchCustomersPages } from '@/app/lib/data';
import { formatCurrency } from '@/app/lib/utils';
import { CustomersTableSkeleton } from '@/app/ui/skeletons';
export const dynamic = 'force-dynamic';
const ITEMS_PER_PAGE = 6; // must match the one in fetchCustomersPages
export default async function Page(props: {
  searchParams?: Promise<{ query?: string; page?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  //const session = await auth();
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'admin';
  let userCustomerIds: string[] = [];
  if (!isAdmin && session?.user?.id) {
    userCustomerIds = await getUserCustomerIds(session.user.id);
  }
  // Fetch total pages for pagination
  const totalPages = await fetchCustomersPages(query, userCustomerIds, isAdmin);
  // Fetch customers for the current page (you'll need to modify fetchFilteredCustomersForUser to accept offset/limit)
  // We'll create a new version that includes pagination, or modify the existing one.
  // For now, let's create a separate function: fetchFilteredCustomersForUserPaginated
  // I'll provide that function below.
  const rawCustomers = await fetchFilteredCustomersForUserPaginated(
    query,
    currentPage,
    userCustomerIds,
    isAdmin
  );
  const formattedCustomers = rawCustomers.map(customer => ({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    image_url: customer.image_url,
    total_invoices: customer.total_invoices,
    total_pending: formatCurrency(customer.total_pending),
    total_paid: formatCurrency(customer.total_paid),
  }));
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Customers</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search customers..." />
      </div>
      <Suspense key={query + currentPage} fallback={<CustomersTableSkeleton />}>
        <CustomersTable customers={formattedCustomers} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}