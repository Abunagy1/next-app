'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function PopupManager() {
  const [showNewsletter, setShowNewsletter] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterName, setNewsletterName] = useState('');

  useEffect(() => {
    const timer1 = setTimeout(() => setShowNewsletter(true), 3000);
    const timer2 = setTimeout(() => setShowDiscount(true), 6000);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', { name: newsletterName, email: newsletterEmail });
    // Here you can send to your API or email service
    setShowNewsletter(false);
    // Optionally show a thank‑you message
  };

  const handleDiscountClose = () => {
    setShowDiscount(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText('FLASH25OFF');
    alert('Promo code copied!');
  };

  return (
    <>
      {/* Newsletter Modal */}
      {showNewsletter && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowNewsletter(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Stay Updated!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Subscribe to our newsletter for exclusive travel deals and tips.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Your name"
                value={newsletterName}
                onChange={(e) => setNewsletterName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
              <input
                type="email"
                placeholder="Email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscount && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={handleDiscountClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            <div className="text-center">
              <div className="inline-block bg-yellow-500 text-black text-sm font-bold px-3 py-1 rounded-full mb-4">
                LIMITED TIME OFFER
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Get $25 OFF Membership!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Use code <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">FLASH25OFF</span> at checkout.
              </p>
              <button
                onClick={handleCopyCode}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}