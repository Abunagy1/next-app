'use client';
import Image from 'next/image';
import { Input } from '@/components/local-ui/input';
import { isEmailValid } from '@/app/lib/utils';
import { useState, useEffect, useRef } from 'react';
import mailbox from '@/public/travel/images/mailbox.svg';
import subscribeAction from '@/app/lib/actions/subscribeAction';
import { SubmitBtn } from './local-ui/SubmitBtn';
import { useActionState } from 'react';   // ✅ new import
interface SubscribeNewsletterProps {
  isSubscribed?: boolean;
}

export function SubscribeNewsletter({ isSubscribed = false }: SubscribeNewsletterProps) {
  //const [state, formAction] = useFormState(subscribeAction, null);
  const [state, formAction] = useActionState(subscribeAction, null);
  const [height, setHeight] = useState(0);
  const [error, setError] = useState<string>();
  const [subscribed, setSubscribed] = useState(isSubscribed);
  const newsletterRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    newsletterRef.current = document.getElementById('newsletter');
    const updateHeight = () => {
      if (newsletterRef.current) {
        const parentHeight = newsletterRef.current.parentElement?.clientHeight || 0;
        const childHeight = newsletterRef.current.clientHeight;
        const h = parentHeight - childHeight / 2;
        setHeight(isNaN(h) ? 500 : h);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Handle subscription state changes (from server action)
  useEffect(() => {
    if (state?.success === true) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(undefined);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubscribed(true);
      localStorage.setItem('subscribed', 'true');
    } else if (state?.success === false && state?.error) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(state.error);
    }
  }, [state]);

  // Initial check for existing subscription
  useEffect(() => {
    const subscribedFlag = localStorage.getItem('subscribed');
    if (subscribedFlag) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSubscribed(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value && !isEmailValid(value)) {
      setError('Please enter a valid email');
    } else {
      setError(undefined);
    }
  };

  return (
    <>
      <section
        id="newsletter"
        className="relative z-10 mx-auto mb-[80px] flex h-[305px] w-[90%] items-end justify-between gap-[16px] rounded-[20px] bg-[#CDEAE1] dark:bg-gray-700 px-[24px]"
      >
        <div className="self-center">
          <h2 className="mb-[10px] text-[1.5rem] font-bold leading-[3.375rem] text-secondary dark:text-white lg:text-[2.5rem] xl:text-[2.75rem]">
            Subscribe Newsletter
          </h2>
          <h3 className="mb-[8px] text-[1rem] font-bold text-secondary/80 dark:text-gray-300 xl:text-[1.25rem]">
            The Travel
          </h3>
          <p className="mb-[16px] text-[0.875rem] font-medium text-secondary/70 dark:text-gray-400 md:text-[1rem]">
            Get inspired! Receive travel discounts, tips and behind the scenes stories.
          </p>
          <div>
            {subscribed ? (
              <h3 className="rounded-[8px] bg-primary px-[16px] py-[8px] text-xl font-bold text-white dark:bg-primary/80">
                Thank you for your subscription!!&nbsp;
              </h3>
            ) : (
              <form id="subscribe" action={formAction} className="flex h-[40px] gap-[16px] lg:h-[56px]">
                <Input
                  label=""
                  error={error}
                  autoComplete="off"
                  name="subscribe-email"
                  type="email"
                  placeholder="Your email address"
                  onChange={handleChange as any}
                  className="grow dark:bg-gray-800 dark:text-white dark:border-gray-600"
                />
                <SubmitBtn
                  formId="subscribe"
                  variant="secondary"
                  customTitle={{
                    default: 'Subscribe',
                    onSubmitting: 'Subscribing...',
                  }}
                  className="h-full grow-0 disabled:bg-[#737373] disabled:text-[#ffffff] dark:bg-primary dark:hover:bg-primary/80"
                  disabled={false}
                />
              </form>
            )}
          </div>
        </div>
        <div className="flex h-full items-end self-end max-md:hidden">
          <Image
            priority
            className="h-auto max-h-full"
            src={mailbox}
            alt="mailbox"
            width={500}
            height={500}
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
      </section>
      {/* <div
        style={{
          position: 'absolute',
          width: '100%',
          bottom: 0,
          backgroundColor: '#8DD3BB',
          height: height + 'px',
        }}
        className="dark:bg-gray-600"
      /> */}
      <div
        className="absolute bottom-0 w-full bg-[#8DD3BB] dark:bg-gray-600"
        style={{ height: height + 'px' }}
      />
    </>
  );
}