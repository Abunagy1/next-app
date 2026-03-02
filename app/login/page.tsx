import { Suspense } from 'react';
import AcmeLogo from '@/app/ui/acme-logo';
import LoginForm from '@/app/ui/login-form';
import Link from 'next/link';

export default async function LoginPage({
  searchParams,
}: {
    searchParams?: Promise<{ registered?: string; verified?: string; reset?: string }>;
}) {
  const params = await searchParams || {};

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <AcmeLogo />
          </div>
          {params.registered === '1' && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
              Account created! A verification link has been sent to your email.{' '}
              <Link href="/dashboard/profile" className="font-bold underline">
                Complete your profile
              </Link>.
            </div>
          )}
          {params.verified === '1' && (
            <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
              Email verified! You can now log in.
            </div>
          )}
            {params.reset === '1' && (
              <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
                Password reset successful! You can now log in with your new password.
              </div>
            )}
          <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}