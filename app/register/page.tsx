import SignupForm from '@/app/ui/signup-form';
import { Suspense } from 'react';
import AcmeLogo from '@/app/ui/acme-logo';
export const dynamic = 'force-dynamic';
export default function RegisterPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <AcmeLogo />
          </div>
          <Suspense fallback={<div className="text-center text-gray-600 dark:text-gray-400">Loading...</div>}>
            <SignupForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}