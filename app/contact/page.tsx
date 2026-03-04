import { Suspense } from 'react';
import ContactForm from '@/app/ui/contact-form';
import AcmeLogo from '@/app/ui/acme-logo';

export default function ContactPage() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <AcmeLogo />
          </div>
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">Contact Me</h1>
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <ContactForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}