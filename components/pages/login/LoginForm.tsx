// "use client";
// import { Input } from "@/components/local-ui/input";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { AuthenticateWith } from "@/components/local-ui/authenticateWith";
// import { SuccessMessage } from "@/components/local-ui/successMessage";
// import { ErrorMessage } from "@/components/local-ui/errorMessage";
// import { authenticateAction } from "@/app/lib/actions/authenticateActions";
// import { useFormState, useFormStatus } from "react-dom";
// import routes from "@/data/routes.json";
// import { cn } from "@/app/lib/utils";
// import { useState } from "react";
// interface LoginFormProps {
//   className?: string;
// }
// export function LoginForm({ className }: LoginFormProps) {
//   const [key, setKey] = useState(0);
//   const [state, dispatch] = useFormState(authenticateAction, null);
//   if (state?.success === true) {
//     setKey((prev) => prev + 1);
//   }
//   return (
//     <div className={cn("rounded-lg bg-white p-7 shadow-lg", className)}>
//       <div className="mb-5" aria-live="polite" aria-atomic="true">
//         {state?.success === false && state?.message && <ErrorMessage message={state.message} />}
//         {state?.success === true && state?.message && <SuccessMessage message={state.message} />}
//       </div>
//       <form action={dispatch} key={key}>
//         <Input
//           type="email"
//           placeholder="Enter your email"
//           name="email"
//           label="Email"
//           error={state?.error?.email}
//           className="mb-[24px]"
//         />
//         <Input
//           type="password"
//           placeholder="Enter your password"
//           name="password"
//           label="Password"
//           error={state?.error?.password}
//           className="mb-[24px]"
//         />
//         <div className="flex justify-between">
//           <div className="grow">
//             <Link href={routes["forgot-password"].path} className="float-right text-[0.875rem] text-tertiary">
//               {routes["forgot-password"].title}
//             </Link>
//           </div>
//         </div>
//         <LoginBtn />
//         <div className="mt-[16px] text-center text-[0.875rem] font-medium text-secondary">
//           Don&apos;t have an account?{" "}
//           <Link href={routes.signup.path} className="text-tertiary">
//             {routes.signup.title}
//           </Link>
//         </div>
//       </form>
//       <AuthenticateWith message="Or Login With" />
//     </div>
//   );
// }
// function LoginBtn() {
//   const { pending } = useFormStatus();
//   return (
//     <Button type="submit" className="mt-10 w-full" disabled={pending}>
//       {pending ? "Submitting..." : "Login"}
//     </Button>
//   );
// }

'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { lusitana } from '@/app/ui/fonts';
import { AtSymbolIcon, KeyIcon, ExclamationCircleIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Button } from '../../../app/ui/button';
import Link from 'next/link';
import { AuthenticateWith } from '@/components/local-ui/authenticateWith'; // ← add social login
/*
uses signIn('credentials', ...) directly from NextAuth. That’s a perfectly valid approach—it calls
the same /api/auth/callback/credentials endpoint that the authenticateAction uses, but from the client side.
*/
export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    });
    if (result?.error) {
      switch (result.error) {
        case 'User not found':
          setError('This user does not exist. Please sign up first.');
          break;
        case 'Invalid password':
          setError('Incorrect password. Please try again.');
          break;
        case 'Email not verified':
          setError('Please verify your email before logging in.');
          break;
        default:
          setError('Invalid credentials. Please try again.');
      }
      setLoading(false);
    } else {
      router.push(result?.url || callbackUrl);
    }
  };
  return (
    <> 
    <form onSubmit={handleSubmit} className="space-y-6">
      <h1 className={`${lusitana.className} text-2xl text-gray-900 dark:text-white text-center`}>
        Please log in
      </h1>
      <div className="space-y-4">
        {/* Email */}
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <AtSymbolIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>
        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter password"
              required
              minLength={6}
              className="w-full pl-10 pr-12 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="mt-2 text-right">
            <Link href="/user/forgot-password" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
      <Button type="submit" className="w-full justify-center" disabled={loading}>
        {loading ? 'Logging in...' : 'Log in'} <ArrowRightIcon className="ml-2 h-5 w-5" />
      </Button>
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <ExclamationCircleIcon className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link href="/user/signup" className="text-blue-600 hover:underline dark:text-blue-400">
          Sign up
        </Link>
      </div>
    </form>
    {/* Social login – a sibling of the form, not nested inside it */}
    <div className="mt-4">
      <AuthenticateWith message="Or Login With" />
    </div>
    </>
  );
}