import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ServicesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/user/login');
  if (session.user?.role === 'admin') redirect('/dashboard');  // 👈 admins go to dashboard
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Services</h1>
      <p className="text-gray-600 dark:text-gray-400">Services page coming soon...</p>
    </div>
  );
}