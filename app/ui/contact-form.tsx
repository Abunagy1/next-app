'use client';
import { useActionState } from 'react';
import { sendContactMessage } from '@/app/lib/actions';
import { Button } from './button';
import { UserIcon, AtSymbolIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export default function ContactForm() {
  const [errorMessage, formAction, isPending] = useActionState(sendContactMessage, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Name
          </label>
          <div className="relative">
            <input
              id="name"
              type="text"
              name="name"
              placeholder="John Doe"
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Email
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              name="email"
              placeholder="you@example.com"
              required
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
            <AtSymbolIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message
          </label>
          <div className="relative">
            <textarea
              id="message"
              name="message"
              rows={5}
              placeholder="Your message..."
              required
              minLength={2}  // HTML5 validation (optional, but helpful)
              maxLength={1000} // optional limit
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
            <ChatBubbleLeftIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          </div>
        {/* Helper text */}
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Minimum 2 characters
        </p>
        </div>
      </div>
      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      <Button type="submit" className="w-full justify-center" aria-disabled={isPending}>
        {isPending ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}