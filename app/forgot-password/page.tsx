import { Suspense } from 'react';
import ForgotPasswordForm from '../ui/forgot-password-form';
import AcmeLogo from '@/app/ui/acme-logo';

export default function ForgotPasswordPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <AcmeLogo />
          </div>
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <ForgotPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}