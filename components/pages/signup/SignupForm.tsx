// "use client";

// import React from "react";
// import { Input } from "@/components/local-ui/input";
// import { Checkbox } from "@/components/ui/checkbox";
// import { SubmitBtn } from "@/components/local-ui/SubmitBtn";
// import Link from "next/link";
// import { AuthenticateWith } from "@/components/local-ui/authenticateWith";
// import { ErrorMessage } from "@/components/local-ui/errorMessage";
// import { SuccessMessage } from "@/components/local-ui/successMessage";
// import { signUpAction } from "@/app/lib/actions/signUpAction";
// //import { useFormState } from "react-dom";
// import { useActionState } from 'react'
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";
// import routes from "@/data/routes.json";

// export function SignupForm() {
//   const router = useRouter();
//   const [state, dispatch] = useActionState(signUpAction, undefined); // it was previously useFormState

//   useEffect(() => {
//     if (state?.success === true && state?.error === undefined) {
//       setTimeout(() => router.push(`${routes.login.path}?signedUp=true`), 1000);
//     }
//   }, [state, router]);

//   return (
//     <div className="rounded-lg bg-white p-7 shadow-lg">
//       <div className="mb-4" aria-live="polite" aria-atomic="true">
//         {state?.success === false && state?.message && <ErrorMessage message={state.message} />}
//         {state?.success === true && state?.message && <SuccessMessage message={state.message} />}
//       </div>
//       <form id="signup-form" action={dispatch} className="space-y-4">
//         <input type="hidden" name="action" value="signup" />
//         <div className="grid gap-4 md:grid-cols-2">
//           <Input placeholder="Enter your first name" name="firstname" label="First Name" error={state?.error?.firstname} required className="max-sm:col-span-2" />
//           <Input placeholder="Enter your last name" name="lastname" label="Last Name" error={state?.error?.lastname} required className="max-sm:col-span-2" />
//           <Input type="email" placeholder="Enter your email address" name="email" label="Email" error={state?.error?.email} required className="max-sm:col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-1" />
//           <Input type="tel" placeholder="Enter your phone number (optional)" dialCodePlaceholder="+XXX" name="phone" label="Phone (optional)" error={state?.error?.phone} maxLength={15} className="max-sm:col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-1" />
//           <Input type="password" placeholder="Enter your password" name="password" label="Password" error={state?.error?.password} className="col-span-2" required />
//           <Input type="password" placeholder="Enter same password again" name="confirmPassword" label="Confirm Password" error={state?.error?.confirmPassword} className="col-span-2" required />
//         </div>
//         <div className="flex items-center gap-2 text-secondary">
//           <Checkbox id="acceptTerms" name="acceptTerms" error={state?.error?.acceptTerms} label={
//             <span className="select-none text-xs text-secondary">
//               I agree to all the <Link href={routes["terms-of-service"].path} target="_blank" className="select-text text-tertiary">{routes["terms-of-service"].title}</Link> and <Link href={routes["privacy-policy"].path} target="_blank" className="select-text text-tertiary">{routes["privacy-policy"].title}</Link>
//             </span>
//           } />
//         </div>
//         <SubmitBtn formId="signup-form" className="!mt-[24px] w-full" customTitle={{ default: "Create Account", onSubmitting: "Creating account..." }} />
//       </form>
//       <div className="mt-[16px] text-center text-[0.875rem] font-medium text-secondary">
//         Already have an account? <Link href={routes.login.path} className="text-tertiary">{routes.login.title}</Link>
//       </div>
//       <AuthenticateWith message="Or signup with" />
//     </div>
//   );
// }
'use client';
import { lusitana } from '@/app/ui/fonts';
import { UserIcon, AtSymbolIcon, KeyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '../../../app/ui/button';
import { useActionState } from 'react';
import { signUpAction } from '@/app/lib/actions/signUpAction';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthenticateWith } from '@/components/local-ui/authenticateWith';
import routes from '@/data/routes.json';

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUpAction, undefined);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const router = useRouter();
  const errors = (state as any)?.error || {};

  useEffect(() => {
    if (state?.success === true && state?.error === undefined) {
      setTimeout(() => {
        router.push(`${routes.login.path}?signedUp=true`);
      }, 1000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        <h1 className={`${lusitana.className} text-2xl text-gray-900 dark:text-white text-center`}>
          Create an account
        </h1>

        <div className="space-y-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
            <div className="relative">
              <input
                id="firstname"
                type="text"
                name="firstname"
                placeholder="Enter your first name"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.firstname && <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
            <div className="relative">
              <input
                id="lastname"
                type="text"
                name="lastname"
                placeholder="Enter your last name"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.lastname && <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <div className="relative">
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <AtSymbolIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone (optional) */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone (optional)</label>
            <div className="relative">
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="Enter your phone number"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <div className="relative">
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter password"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
              <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-2">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              required
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="mt-1"
            />
            <label htmlFor="acceptTerms" className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
              I agree to all the{' '}
              <Link href="/terms-of-service" target="_blank" className="text-blue-600 underline">Terms of Service</Link>{' '}
              and{' '}
              <Link href="/privacy-policy" target="_blank" className="text-blue-600 underline">Privacy Policy</Link>
            </label>
            {errors.acceptTerms && <p className="text-red-500 text-xs">{errors.acceptTerms}</p>}
          </div>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {(state as any)?.success === false && (state as any)?.message && (
            <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <ExclamationCircleIcon className="h-5 w-5" />
              <p>{(state as any).message}</p>
            </div>
          )}
          {(state as any)?.success === true && (state as any)?.message && (
            <div className="flex items-center gap-2 text-green-500 text-sm p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p>{(state as any).message}</p>
            </div>
          )}
        </div>

        <Button type="submit" className="w-full justify-center" disabled={isPending}>
          {isPending ? 'Creating account...' : 'Sign up'}
          <ArrowRightIcon className="ml-2 h-5 w-5" />
        </Button>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400">
            Log in
          </Link>
        </p>
      </form>

      {/* Social login – outside the main form, but inside the card */}
      <AuthenticateWith message="Or sign up with" />
    </div>
  );
}