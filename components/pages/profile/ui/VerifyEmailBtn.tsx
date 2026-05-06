'use client';
import { useActionState } from 'react'
import { SubmitBtn } from '@/components/local-ui/SubmitBtn';
import { sendEmailConfimationLinkAction } from '@/app/lib/actions/sendEmailActions';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useRef, useState } from 'react';
import { addMinutes } from 'date-fns';

interface VerifyEmailBtnProps {
  email: string;
  sendAgainAt?: string;
}

export function VerifyEmailBtn({ email, sendAgainAt }: VerifyEmailBtnProps) {
  const { toast } = useToast();
  const [state, dispatch] = useActionState(sendEmailConfimationLinkAction, undefined); //it was useFormState peviously
  const [emailsSent, setEmailsSent] = useState<Record<string, boolean>>({});
  const [countdown, setCountdown] = useState<string | null>(null);
  const interval = useRef<NodeJS.Timeout | null>(null);

  function countdownTimer() {
    const canSendAgainAt = localStorage.getItem('sendAgainAt') || sendAgainAt;
    if (canSendAgainAt) {
      interval.current = setInterval(() => {
        const nextAllowedTime = new Date(canSendAgainAt);
        const currentTime = new Date();
        const timeDiff = nextAllowedTime.getTime() - currentTime.getTime();
        if (timeDiff <= 0) {
          localStorage.removeItem('sendAgainAt');
          queueMicrotask(() => setCountdown(null));
          if (interval.current) clearInterval(interval.current);
          return;
        }
        const minutes = Math.floor(timeDiff / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        queueMicrotask(() =>
          setCountdown(minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0'))
        );
      }, 1000);
    }
  }

  useEffect(() => {
    const emailsSent = localStorage.getItem('emailsSent');
    if (emailsSent) {
      queueMicrotask(() => setEmailsSent(JSON.parse(emailsSent)));
    }
    countdownTimer();
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, []);

  useEffect(() => {
    countdownTimer();
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [emailsSent, sendAgainAt]);

  useEffect(() => {
    if (state?.success === true) {
      toast({ title: 'Email Sent', description: state.message, variant: 'default' });
      localStorage.setItem('emailsSent', JSON.stringify({ [email]: true }));
      const newSendAgainAt = addMinutes(new Date(), 2).toISOString();
      localStorage.setItem('sendAgainAt', newSendAgainAt);
      queueMicrotask(() => setEmailsSent({ [email]: true }));
    }
    if (state?.success === false) {
      toast({ title: 'Error', description: state.message, variant: 'destructive' });
    }
  }, [state, email, toast]);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append('email', email);
    dispatch(formData);
  };

  return (
    <form id="verify-email-form" className="inline-block text-base leading-none" action={handleSubmit}>
      <SubmitBtn
        formId="verify-email-form"
        className="text-xs p-0 inline h-min font-normal text-blue-500 underline disabled:text-gray-500"
        disabled={countdown !== null}
        variant="link"
        customTitle={{
          default: emailsSent[email]
            ? countdown
              ? 'Resend in ' + countdown
              : 'Verify email'
            : 'Verify email',
          onSubmitting: 'Sending code...',
        }}
      />
    </form>
  );
}

// components/pages/profile/ui/VerifyEmailBtn.tsx
// 'use client';
// import { useActionState } from 'react'
// import { SubmitBtn } from '@/components/local-ui/SubmitBtn';
// import { sendEmailConfimationLinkAction } from '@/app/lib/actions/sendEmailActions';
// import { useToast } from '@/components/ui/use-toast';
// import { useEffect, useRef, useState } from 'react';
// import { addMinutes } from 'date-fns';

// interface VerifyEmailBtnProps {
//   email: string;
//   sendAgainAt?: string;
// }

// export function VerifyEmailBtn({ email, sendAgainAt }: VerifyEmailBtnProps) {
//   const { toast } = useToast();
//   const [state, dispatch] = useActionState(sendEmailConfimationLinkAction, undefined);
//   const [emailsSent, setEmailsSent] = useState<Record<string, boolean>>({});
//   const [countdown, setCountdown] = useState<string | null>(null);
//   const interval = useRef<NodeJS.Timeout | null>(null);

//   function countdownTimer() {
//     const canSendAgainAt = localStorage.getItem('sendAgainAt') || sendAgainAt;
//     if (canSendAgainAt) {
//       interval.current = setInterval(() => {
//         const nextAllowedTime = new Date(canSendAgainAt);
//         const currentTime = new Date();
//         const timeDiff = nextAllowedTime.getTime() - currentTime.getTime();
//         if (timeDiff <= 0) {
//           localStorage.removeItem('sendAgainAt');
//           setCountdown(null);
//           if (interval.current) clearInterval(interval.current);
//           return;
//         }
//         const minutes = Math.floor(timeDiff / (1000 * 60));
//         const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
//         setCountdown(minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0'));
//       }, 1000);
//     }
//   }

//   useEffect(() => {
//     const emailsSent = localStorage.getItem('emailsSent');
//     if (emailsSent) setEmailsSent(JSON.parse(emailsSent));
//     countdownTimer();
//     return () => { if (interval.current) clearInterval(interval.current); };
//   }, []);

//   useEffect(() => {
//     countdownTimer();
//     return () => { if (interval.current) clearInterval(interval.current); };
//   }, [emailsSent, sendAgainAt]);

//   useEffect(() => {
//     if (state?.success === true) {
//       toast({ title: 'Email Sent', description: state.message });
//       localStorage.setItem('emailsSent', JSON.stringify({ [email]: true }));
//       const newSendAgainAt = addMinutes(new Date(), 2).toISOString();
//       localStorage.setItem('sendAgainAt', newSendAgainAt);
//       setEmailsSent({ [email]: true });
//     }
//     if (state?.success === false) {
//       toast({ title: 'Error', description: state.message, variant: 'destructive' });
//     }
//   }, [state, email, toast]);

//   const handleSubmit = () => {
//     const formData = new FormData();
//     formData.append('email', email);
//     dispatch(formData);
//   };

//   return (
//     <form id="verify-email-form" className="inline-block text-base leading-none" action={handleSubmit}>
//       <button
//         type="submit"
//         disabled={!!countdown}
//         className="text-xs p-0 inline font-normal text-blue-500 underline disabled:text-gray-500"
//       >
//         {emailsSent[email] ? (countdown ? `Resend in ${countdown}` : 'Resend verification') : 'Verify email'}
//       </button>
//       {state?.success === false && <span className="text-red-500 text-xs ml-1">{state.message}</span>}
//     </form>
//   );
// }