// This page file is responsible for returning the content of the UI for the /dashboard/invoices path Route
import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/invoices/table';
import { CreateInvoice } from '@/app/ui/invoices/buttons';
import { lusitana } from '@/app/ui/fonts';
import { InvoicesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { getUserCustomerIds } from '@/app/lib/data';
export const metadata: Metadata = {
  title: 'Invoices',
};
/*
Navigate to the <Pagination/> component and you'll notice that it's a Client Component.
You don't want to fetch data on the client as this would expose your database secrets (remember,
you're not using an API layer). Instead, you can fetch the data on the server, and pass it to the component as a prop.
In /dashboard/invoices/page.tsx, import a new function called fetchInvoicesPages and pass the query from searchParams as an argument:
*/
import { fetchInvoicesPages } from '@/app/lib/data';
// app/dashboard/invoices/page.tsx
import { auth } from '@/auth';
/* 
<Search/> allows users to search for specific invoices.
<Pagination/> allows users to navigate between pages of invoices.
<Table/> displays the invoices.

useSearchParams- Allows you to access the parameters of the current URL.
For example, the search params for this URL
/dashboard/invoices?page=1&query=pending would look like this: {page: '1', query: 'pending'}.
usePathname - Lets you read the current URL's pathname. For example,
for the route /dashboard/invoices, usePathname would return '/dashboard/invoices'.
useRouter - Enables navigation between routes within client components programmatically.
There are multiple methods you can use.
Here's a quick overview of the implementation steps:

Capture the user's input.
Update the URL with the search params.
Keep the URL in sync with the input field.
Update the table to reflect the search query.
*/

/*
you need to update the table component to reflect the search query.
Page components accept a prop called searchParams, so you can pass the current URL params to the <Table> component.
*/
export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';
  const userId = session?.user?.id;
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  let userCustomerIds: string[] = [];
  if (userId && !isAdmin) {
    userCustomerIds = await getUserCustomerIds(userId);
  }
  //fetchInvoicesPages returns the total number of pages based on the search query.
  const totalPages = await fetchInvoicesPages(query, userCustomerIds, isAdmin);
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Invoices</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search invoices..." />
        {isAdmin && <CreateInvoice />}   {/* Only admin can create */}
      </div>
      {/* ... heading and search ... */}
      <Suspense key={query + currentPage} fallback={<InvoicesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} userCustomerIds={userCustomerIds} isAdmin={isAdmin} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
    
  );
}
/*
When to use the useSearchParams() hook vs. the searchParams prop?
You might have noticed you used two different ways to extract search params.

Whether you use one or the other depends on whether you're working on the client or the server.
<Search> is a Client Component, so you used the useSearchParams() hook to access the params from the client.
<Table> is a Server Component that fetches its own data, so you can pass the searchParams prop from the page to the component.
As a general rule, if you want to read the params from the client,
use the useSearchParams() hook as this avoids having to go back to the server.
*/