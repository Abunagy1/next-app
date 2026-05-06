"use client";
import { Input } from "@/components/local-ui/input";
import { SubmitBtn } from "@/components/local-ui/SubmitBtn";
import { AuthenticateWith } from "@/components/local-ui/authenticateWith";
import sendPassResetCodeAction from "@/app/lib/actions/sendPassResetCodeAction";
import { Button } from "../../../app/ui/button";
import { lusitana } from '@/app/ui/fonts';
import { KeyIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { useActionState } from 'react';
import { resetPassword } from '@/app/lib/actions';
import Link from 'next/link';
import { AtSymbolIcon } from '@heroicons/react/24/outline';
//import { useFormState } from "react-dom";

// export function PasswordResetForm() {
//   const [state, dispatch] = useActionState(sendPassResetCodeAction, undefined); // it was previously useFormState
//   return (
//     <div className={"bg-white p-7 rounded-lg shadow-lg"}>
//       <form id={"password-reset-form"} action={dispatch}>
//         <Input
//           label={"Email"}
//           type={"email"}
//           name="email"
//           placeholder="Enter email address"
//           className={"mb-3"}
//           error={state?.error?.email}
//         />
//         <SubmitBtn formId={"password-reset-form"} />
//       </form>
//       <AuthenticateWith message={"Or login with"} />
//     </div>
//   );
// }

export default function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(sendPassResetCodeAction, undefined);

  // Per‑field error from the server action
  const emailError = (state as any)?.error?.email;

  return (
    <form action={formAction} className="space-y-6">
      <h1 className={`${lusitana.className} text-2xl text-gray-900 dark:text-white text-center`}>
        Reset your password
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
        Enter your email address and we’ll send you a verification code.
      </p>

      {/* Email input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              emailError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          <AtSymbolIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
      </div>

      {/* General error / success message */}
      <div aria-live="polite" aria-atomic="true">
        {(state as any)?.success === false && (state as any)?.message && !emailError && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {(state as any).message}
          </div>
        )}
        {(state as any)?.success === true && (state as any)?.message && (
          <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
            {(state as any).message}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full justify-center" aria-disabled={isPending}>
        {isPending ? 'Sending...' : 'Send verification code'}
        <ArrowRightIcon className="ml-2 h-5 w-5" />
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Remember your password?{' '}
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
          Log in
        </Link>
      </p>
    </form>
  );
}