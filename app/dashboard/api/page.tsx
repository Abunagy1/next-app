import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ApiPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') redirect('/dashboard');
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Access</h1>
      <p className="text-gray-600 dark:text-gray-400">API documentation coming soon…</p>
    </div>
  );
}