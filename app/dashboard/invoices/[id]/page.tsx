import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchInvoiceById, fetchCustomers } from '@/app/lib/data';
import { notFound } from 'next/navigation';
// To Read the invoice id from page params
import { getUserCustomerIds } from '@/app/lib/data';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  const { auth } = await import('@/auth');
  const session = await auth();
  const isAdmin = session?.user?.role === 'admin';
  let userCustomerIds: string[] = [];
  if (!isAdmin && session?.user?.id) {
    userCustomerIds = await getUserCustomerIds(session.user.id);
  }
  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ]);

  if (!invoice) {
    notFound();
  }
  // If not admin, ensure invoice's customer_id belongs to user
  if (!isAdmin && !userCustomerIds.includes(invoice.customer_id)) {
    notFound();
  }
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}