import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function SuccessPage({
  searchParams,
}: {
  searchParams?: Promise<{ invoiceId?: string }>;
}) {
  const params = await searchParams || {};
  return (
    <div className="container mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Purchase Successful!</h1>
      <p>Your invoice ID is: <span className="font-mono">{params.invoiceId}</span></p>
      <p className="mt-2">A confirmation email has been sent.</p>
      <Link
        href="/store"
        className="mt-6 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Continue Shopping
      </Link>
    </div>
  );
}