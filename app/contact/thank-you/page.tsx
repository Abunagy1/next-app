import Link from 'next/link';

export default function ThankYouPage() {
  return (
    <div className="container mx-auto max-w-2xl p-6 text-center">
      <h1 className="text-3xl font-bold text-green-600 mb-4">Thank You!</h1>
      <p className="mb-6">Your message has been sent. We'll get back to you soon.</p>
      <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
    </div>
  );
}