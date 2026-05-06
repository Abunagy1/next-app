"use client";
import { Input } from "@/components/local-ui/input";
//import { Button } from "@/components/ui/button";
import { Button } from "../../../app/ui/button";
import { ErrorMessage } from "@/components/local-ui/errorMessage";
import { SuccessMessage } from "@/components/local-ui/successMessage";
import { AuthenticateWith } from "@/components/local-ui/authenticateWith";
import setNewPasswordAction from "@/app/lib/actions/setNewPasswordAction";
import { requestPasswordReset } from '@/app/lib/actions';
import { useFormStatus } from "react-dom"; // useFormState
import { useActionState } from 'react'
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import routes from "@/data/routes.json";
import { lusitana } from '@/app/ui/fonts';
import { AtSymbolIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { KeyIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
// export function SetNewPasswordForm() {
//   const router = useRouter();
//   const [state, dispatch] = useActionState(setNewPasswordAction, undefined); // it was useFormState
//   useEffect(() => {
//     if (state?.success === true) {
//       setTimeout(() => router.replace(routes.login.path), 1000);
//     }
//   }, [state?.success, router]);
//   return (
//     <div className="bg-white p-7 rounded-lg shadow-lg">
//       <div className="mb-5">
//         {state?.success === false && state?.message && <ErrorMessage message={state.message} />}
//         {state?.success === true && state?.message && <SuccessMessage message={state.message} />}
//       </div>
//       <form id="set-new-password-form" action={dispatch}>
//         <Input label="Create Password" type="password" name="password" placeholder="Enter new password" className="mb-3" error={state?.error?.password} />
//         <Input label="Re-enter Password" type="password" name="confirmPassword" placeholder="Enter new password" className="mb-3" error={state?.error?.confirmPassword} />
//         <SubmitBtn formId="set-new-password-form" />
//       </form>
//       <AuthenticateWith message="Or login with" />
//     </div>
//   );
// }
// function SubmitBtn({ formId }: { formId: string }) {
//   const { pending } = useFormStatus();
//   return (
//     <Button form={formId} disabled={pending} size="lg" type="submit">
//       Set password
//     </Button>
//   );
// }
export default function SetNewPasswordForm() {
  const [state, formAction, isPending] = useActionState(setNewPasswordAction, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <h1 className={`${lusitana.className} text-2xl text-gray-900 dark:text-white text-center`}>
        Set new password
      </h1>

      <div className="space-y-4">
        {/* New Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Enter new password"
              required
              minLength={6}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                (state as any)?.error?.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {(state as any)?.error?.password && (
            <p className="text-red-500 text-xs mt-1">{(state as any).error.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="Confirm new password"
              required
              minLength={6}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                (state as any)?.error?.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          {(state as any)?.error?.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{(state as any).error.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* General error / success message */}
      <div aria-live="polite" aria-atomic="true">
        {(state as any)?.success === false && (state as any)?.message && !(state as any)?.error?.password && !(state as any)?.error?.confirmPassword && (
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
        {isPending ? 'Saving...' : 'Set password'}
        <ArrowRightIcon className="ml-2 h-5 w-5" />
      </Button>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
          Back to login
        </Link>
      </p>
    </form>
  );
}