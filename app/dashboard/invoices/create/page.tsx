//this page component is a Server Component that fetches customers and passes it to the <Form> component.
//To save time, we've already created the <Form> component for you.

import Form from '@/app/ui/invoices/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';

/*
Here are the steps you'll take to create a new invoice:

Create a form to capture the user's input.
Create a Server Action and invoke it from the form.
Inside your Server Action, extract the data from the formData object.
Validate and prepare the data to be inserted into your database.
Insert the data and handle any errors.
Revalidate the cache and redirect the user back to invoices page.

Navigate to the <Form> component, and you'll see that the form:
On http://localhost:3000/dashboard/invoices/create
Has one <select> (dropdown) element with a list of customers.
Has one <input> element for the amount with type="number".
Has two <input> elements for the status with type="radio".
Has one button with type="submit".
*/
export default async function Page() {
  const customers = await fetchCustomers();
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Create Invoice',
            href: '/dashboard/invoices/create',
            active: true,
          },
        ]}
      />
      <Form customers={customers} />
    </main>
  );
}