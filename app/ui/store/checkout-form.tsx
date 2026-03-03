'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentElement, useStripe, useElements, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { createPaymentIntent, createStoreInvoice } from '@/app/lib/actions';
import { Product } from '@/app/lib/definitions';
import { RadioGroup } from '@headlessui/react';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
type PaymentMethod = 'stripe' | 'bank_transfer' | 'ideal' | 'sepa_debit';
export default function CheckoutForm({ product, user }: { product: Product; user?: any }) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);
  const [error, setError] = useState('');
  const handlePaymentMethodChange = async (method: PaymentMethod) => {
    setPaymentMethod(method);
    setClientSecret(null);
    setBankDetails(null);
    setError('');
    const formData = new FormData();
    formData.append('productId', product.id!.toString());
    formData.append('quantity', '1');
    formData.append('paymentMethod', method);
    const data = await createPaymentIntent(formData);
    if (!data) {
      setError('No response from payment server');
      return;
    }
    // Check for error first
    if ('error' in data && data.error) {
      setError(data.error);
      return;
    }
    // Now data is the success union
    if (data.paymentMethod === 'bank_transfer') {
      setBankDetails(data.bankDetails);
    } else {
      // For stripe, ideal, sepa_debit – clientSecret must be present
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setError('Missing client secret');
      }
    }
  };
  return (
    <div className="max-w-2xl mx-auto">
      {/* Payment Method Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Select Payment Method
        </h3>
        <RadioGroup value={paymentMethod} onChange={handlePaymentMethodChange}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <RadioGroup.Option value="stripe">
              {({ checked }) => (
                <div className={`${checked ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'} 
                  border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border ${checked ? 'border-blue-500 bg-blue-500' : 'border-gray-400'} mr-3`} />
                    <div>
                      <p className="font-medium">Credit / Debit Card</p>
                      <p className="text-sm text-gray-500">Pay with Visa, Mastercard, etc.</p>
                    </div>
                  </div>
                </div>
              )}
            </RadioGroup.Option>
            <RadioGroup.Option value="bank_transfer">
              {({ checked }) => (
                <div className={`${checked ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'} 
                  border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border ${checked ? 'border-blue-500 bg-blue-500' : 'border-gray-400'} mr-3`} />
                    <div>
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-sm text-gray-500">Pay directly from your bank</p>
                    </div>
                  </div>
                </div>
              )}
            </RadioGroup.Option>
            <RadioGroup.Option value="ideal">
              {({ checked }) => (
                <div className={`${checked ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'} 
                  border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border ${checked ? 'border-blue-500 bg-blue-500' : 'border-gray-400'} mr-3`} />
                    <div>
                      <p className="font-medium">iDEAL</p>
                      <p className="text-sm text-gray-500">Dutch banking</p>
                    </div>
                  </div>
                </div>
              )}
            </RadioGroup.Option>
            <RadioGroup.Option value="sepa_debit">
              {({ checked }) => (
                <div className={`${checked ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'} 
                  border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border ${checked ? 'border-blue-500 bg-blue-500' : 'border-gray-400'} mr-3`} />
                    <div>
                      <p className="font-medium">SEPA Direct Debit</p>
                      <p className="text-sm text-gray-500">European bank accounts</p>
                    </div>
                  </div>
                </div>
              )}
            </RadioGroup.Option>
          </div>
        </RadioGroup>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Payment Form based on selected method */}
      {paymentMethod === 'bank_transfer' && bankDetails && (
        <BankTransferDetails details={bankDetails} product={product} user={user} />
      )}
      {clientSecret && (paymentMethod === 'stripe' || paymentMethod === 'ideal' || paymentMethod === 'sepa_debit') && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm 
            product={product} 
            user={user} 
            paymentMethod={paymentMethod}
          />
        </Elements>
      )}
    </div>
  );
}
// Bank Transfer Details Component
function BankTransferDetails({ details, product, user }: { details: any; product: Product; user?: any }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shipping, setShipping] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = new FormData();
    form.append('productId', product.id!.toString());
    form.append('quantity', '1');
    form.append('paymentMethod', 'bank_transfer');
    form.append('paymentReference', details.reference);
    Object.entries(shipping).forEach(([key, value]) => form.append(key, value));
    try {
      const result = await createStoreInvoice(form);
      if (result?.invoiceId) {
        // Show confirmation or redirect
        router.push(`/store/checkout/success?invoiceId=${result.invoiceId}&method=bank`);
      } else {
        // Handle error
        alert('Failed to place order');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Shipping fields */}
      <div>
        <label className="block text-sm font-medium">Product</label>
        <p className="text-lg font-semibold">{product.name} – ${product.price}</p>
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
        <input
          type="text"
          id="name"
          value={shipping.name}
          onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input
          type="email"
          id="email"
          value={shipping.email}
          onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium">Address</label>
        <input
          type="text"
          id="address"
          value={shipping.address}
          onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>
      <div>
        <label htmlFor="city" className="block text-sm font-medium">City</label>
        <input
          type="text"
          id="city"
          value={shipping.city}
          onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>
      <div>
        <label htmlFor="postalCode" className="block text-sm font-medium">Postal Code</label>
        <input
          type="text"
          id="postalCode"
          value={shipping.postalCode}
          onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>
      <div>
        <label htmlFor="country" className="block text-sm font-medium">Country</label>
        <input
          type="text"
          id="country"
          value={shipping.country}
          onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>

      {/* Bank details */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Bank Transfer Instructions</h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
          Please transfer the exact amount to the following account:
        </p>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-gray-600 dark:text-gray-400">Account Name:</dt>
          <dd className="font-mono">{details.accountName}</dd>
          <dt className="text-gray-600 dark:text-gray-400">Account Number:</dt>
          <dd className="font-mono">{details.accountNumber}</dd>
          <dt className="text-gray-600 dark:text-gray-400">Bank Name:</dt>
          <dd>{details.bankName}</dd>
          <dt className="text-gray-600 dark:text-gray-400">SWIFT Code:</dt>
          <dd>{details.swiftCode}</dd>
          <dt className="text-gray-600 dark:text-gray-400">Amount:</dt>
          <dd className="font-bold">${details.amount.toFixed(2)} {details.currency}</dd>
          <dt className="text-gray-600 dark:text-gray-400">Reference:</dt>
          <dd className="font-mono text-xs">{details.reference}</dd>
        </dl>
        <p className="text-xs text-gray-500 mt-3">
          * Please include the reference number in your transfer. Your order will be processed once payment is received.
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Placing Order...' : 'Confirm Bank Transfer Order'}
      </button>
    </form>
  );
}

// Stripe Payment Form (unchanged from previous version, but ensure it uses the correct props)
function StripePaymentForm({ product, user, paymentMethod }: { product: Product; user?: any; paymentMethod: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shipping, setShipping] = useState({
    name: user?.name || '',
    email: user?.email || '',
    address: '',
    city: '',
    postalCode: '',
    country: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/store/checkout/return`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'Payment failed');
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      const form = new FormData();
      form.append('productId', product.id!.toString());
      form.append('quantity', '1');
      form.append('paymentMethod', paymentMethod);
      form.append('paymentIntentId', paymentIntent.id);
      Object.entries(shipping).forEach(([key, value]) => form.append(key, value));

      await createStoreInvoice(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Shipping fields */}
      <div>
        <label className="block text-sm font-medium">Product</label>
        <p className="text-lg font-semibold">{product.name} – ${product.price}</p>
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Full Name</label>
        <input
          type="text"
          id="name"
          value={shipping.name}
          onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">Email</label>
        <input
          type="email"
          id="email"
          value={shipping.email}
          onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium">Address</label>
        <input
          type="text"
          id="address"
          value={shipping.address}
          onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>
      <div>
        <label htmlFor="city" className="block text-sm font-medium">City</label>
        <input
          type="text"
          id="city"
          value={shipping.city}
          onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>
      <div>
        <label htmlFor="postalCode" className="block text-sm font-medium">Postal Code</label>
        <input
          type="text"
          id="postalCode"
          value={shipping.postalCode}
          onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>
      <div>
        <label htmlFor="country" className="block text-sm font-medium">Country</label>
        <input
          type="text"
          id="country"
          value={shipping.country}
          onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800"
          required
        />
      </div>

      <div className="border-t pt-4">
        <PaymentElement />
      </div>

      {errorMessage && <p className="text-red-500">{errorMessage}</p>}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isProcessing ? 'Processing…' : `Pay with ${paymentMethod === 'stripe' ? 'Card' : paymentMethod.toUpperCase()}`}
      </button>
    </form>
  );
}