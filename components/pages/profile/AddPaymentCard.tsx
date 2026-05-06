'use client';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/app/lib/utils';
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useRef, useState } from 'react';
import { InfoIcon, Loader2, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PK!);

interface AddPaymentCardProps {
  customAddButtonElement?: React.ReactNode;
  className?: string;
  reloadSection?: () => void;
}

export function AddPaymentCard({
  customAddButtonElement,
  className,
  reloadSection = () => {},
}: AddPaymentCardProps) {
  const [setupIntentData, setSetupIntentData] = useState<{
    clientSecret: string | null;
    customerId: string | null;
  }>({ clientSecret: null, customerId: null });
  const [fetchingError, setFetchingError] = useState(false);
  const [tryAgain, setTryAgain] = useState(1);
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (opened) {
      getSetupIntent();
    }
  }, [opened, tryAgain]);

  async function getSetupIntent() {
    let idempotencyKey = sessionStorage.getItem('idempotencyKey');
    if (!idempotencyKey) {
      idempotencyKey = Date.now().toString();
      sessionStorage.setItem('idempotencyKey', idempotencyKey);
    }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/stripe/setup_intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idempotencyKey }),
      });
      if (!res.ok) throw new Error('Failed to fetch setup intent');
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSetupIntentData({
        clientSecret: data.data.clientSecret,
        customerId: data.data.customerId,
      });
      setFetchingError(false);
      if (data.data.idempotencyKey !== idempotencyKey) {
        sessionStorage.setItem('idempotencyKey', data.data.idempotencyKey);
      }
    } catch (error) {
      console.error(error);
      setFetchingError(true);
      toast.error('Failed to load payment form. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Dialog open={opened} onOpenChange={setOpened}>
        <DialogTrigger asChild title="Add a new card">
          {customAddButtonElement ?? (
            <div
              className={cn(
                'flex h-[212px] w-[378px] cursor-pointer items-center justify-center rounded-[16px] border-2 border-dashed border-primary',
                className
              )}
            >
              <div className="flex flex-col items-center text-center">
                <PlusIcon className="h-12 w-12 text-gray-400" />
                <p>Add a new card</p>
              </div>
            </div>
          )}
        </DialogTrigger>

        <DialogContent className="max-w-md dark:bg-gray-800 dark:text-white">
          <DialogHeader>
            <DialogTitle>Add a new card</DialogTitle>
            <DialogDescription className="sr-only">
              Enter your card details to save a new payment method.
            </DialogDescription>
          </DialogHeader>

          {loading && <AddPaymentCardLoadingSkeleton />}

          {!loading && fetchingError && (
            <div className="space-y-3">
              <p className="text-sm text-red-600">Failed to load payment form. Please try again.</p>
              <Button onClick={() => setTryAgain(prev => prev + 1)}>Try again</Button>
            </div>
          )}

          {!loading && !fetchingError && (
            <>
              <div className="flex items-center justify-between rounded-md bg-cyan-300 p-3 text-sm font-medium text-cyan-800 dark:bg-cyan-700 dark:text-cyan-200">
                <div className="flex items-center gap-2">
                  <InfoIcon className="h-4 w-4" />
                  Use the following card numbers:{' '}
                  <Link className="ml-1 underline" href="https://stripe.com/docs/testing#cards" target="_blank">
                    Demo cards
                  </Link>
                </div>
              </div>

              {setupIntentData.clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret: setupIntentData.clientSecret }}>
                  <CheckoutForm
                    clientSecret={setupIntentData.clientSecret}
                    setOpened={setOpened}
                    reloadSection={reloadSection}
                  />
                </Elements>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500 dark:text-gray-400">
                  <Loader2 className="mr-2 animate-spin" /> Loading payment form…
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Stripe Element Styles (improved contrast) ----------
const cardStyles = {
  style: {
    base: {
      color: 'inherit',                     // ← inherits container’s text colour
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      lineHeight: '24px',
      // Placeholder colour that works in both light and dark
      '::placeholder': { color: '#9CA3AF' }, // Tailwind gray-400
    },
    invalid: {
      color: '#EF4444',                     // bright red, visible in all modes
      iconColor: '#EF4444',
    },
  },
};

function CheckoutForm({ clientSecret, setOpened, reloadSection }: {
  clientSecret: string;
  setOpened: (open: boolean) => void;
  reloadSection: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [errors, setErrors] = useState<{ cardNumber?: string; cardExpiry?: string; cardCvc?: string }>({});
  const [adding, setAdding] = useState(false);
  const [fieldsVisible, setFieldsVisible] = useState(false);
  const cardNumberRef = useRef<HTMLDivElement>(null);

  // Show fields and instantly focus the card number (real user click)
  const showAndFocus = () => {
    setFieldsVisible(true);
    setTimeout(() => {
      if (!elements) return;
      const cardElement = elements.getElement('cardNumber');
      cardElement?.focus();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setAdding(true);
    const cardElement = elements.getElement('cardNumber');
    if (!cardElement) return;

    const result = await stripe.confirmCardSetup(clientSecret, {
      payment_method: { card: cardElement },
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/user/profile`,
    });

    if (result.error) {
      toast.error(result.error.message || 'Card setup failed');
      setAdding(false);
      return;
    }

    if (result.setupIntent?.status === 'succeeded') {
      cardElement.clear();
      toast.success('Card added successfully');
      sessionStorage.removeItem('idempotencyKey');
      setOpened(false);
      reloadSection();
    }
    setAdding(false);
  };

  const handleChange = (event: any) => {
    setErrors(prev => ({
      ...prev,
      [event.elementType]: event.error ? event.error.message : '',
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4" autoComplete="off">
      {!fieldsVisible ? (
        <div className="text-center">
          <Button type="button" onClick={showAndFocus} variant="outline">
            Click to enter card details
          </Button>
          <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">
            Your card details are securely handled by Stripe
          </p>
        </div>
      ) : (
        <>
          {/* Card Number */}
          <div>
            <label className="text-sm font-medium dark:text-gray-300">Card Number</label>
            <div
              className="mt-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white"
              ref={cardNumberRef}
            >
              <CardNumberElement options={cardStyles} onChange={handleChange} />
            </div>
            {/* Digits‑only hint */}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Only digits are allowed (no spaces or letters).
            </p>
            {errors.cardNumber && (
              <p className="mt-1 text-xs text-red-500">{errors.cardNumber}</p>
            )}
          </div>
          {/* Expiry & CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium dark:text-gray-300">Expiration</label>
              <div className="mt-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white">
                <CardExpiryElement options={cardStyles} onChange={handleChange} />
              </div>
              {errors.cardExpiry && (
                <p className="mt-1 text-xs text-red-500">{errors.cardExpiry}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium dark:text-gray-300">CVC</label>
              <div className="mt-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-gray-900 dark:text-white">
                <CardCvcElement options={cardStyles} onChange={handleChange} />
              </div>
              {errors.cardCvc && (
                <p className="mt-1 text-xs text-red-500">{errors.cardCvc}</p>
              )}
            </div>
          </div>
          <Button type="submit" disabled={!stripe || adding} className="w-full">
            {adding ? 'Adding...' : 'Add Card'}
          </Button>
        </>
      )}
    </form>
  );
}

function AddPaymentCardLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Skeleton className="mb-2 h-4 w-[100px]" />
          <Skeleton className="h-[48px]" />
        </div>
        <div className="grow">
          <Skeleton className="mb-2 h-4 w-[100px]" />
          <Skeleton className="h-[48px]" />
        </div>
        <div className="grow">
          <Skeleton className="mb-2 h-4 w-[100px]" />
          <Skeleton className="h-[48px]" />
        </div>
      </div>
      <Skeleton className="h-[48px]" />
    </div>
  );
}