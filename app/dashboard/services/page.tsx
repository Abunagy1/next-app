import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
export const dynamic = 'force-dynamic';
export default async function ServicesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Services</h1>
      <p className="text-gray-600 dark:text-gray-400">Services page coming soon...</p>
    </div>
  );
}