import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Stripe from 'stripe'; // you may export stripe instance
export const dynamic = 'force-dynamic';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
});
export default async function ReturnPage({
  searchParams,
}: {
  searchParams?: Promise<{ payment_intent?: string }>;
}) {
  const params = await searchParams || {};
  const paymentIntentId = params.payment_intent;
  if (!paymentIntentId) {
    redirect('/store');
  }
  // Retrieve the payment intent to check status
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  if (paymentIntent.status === 'succeeded') {
    // You can also create the invoice here if not already done
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Payment Successful!</h1>
        <p>Thank you for your purchase. A confirmation email has been sent.</p>
        <a href="/store" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
          Continue Shopping
        </a>
      </div>
    );
  } else {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Payment Failed</h1>
        <p>Please try again.</p>
        <a href="/store" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded">
          Back to Store
        </a>
      </div>
    );
  }
}