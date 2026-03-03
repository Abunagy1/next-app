//import { auth } from '@/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { getProductById } from '@/app/lib/data';
import StripeCheckoutForm from '@/app/ui/store/checkout-form';
export const dynamic = 'force-dynamic';
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams?: Promise<{ productId?: string }>;
}) {
  // const session = await auth();
  const session = await getServerSession(authOptions);
  const params = await searchParams || {};
  const productId = params.productId;
  if (!productId) redirect('/store');
  const product = await getProductById(parseInt(productId));
  if (!product) redirect('/store');
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <StripeCheckoutForm product={product} user={session?.user} />
    </div>
  );
}