import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function ServicesPage() {
  const session = await auth();
  if (!session) redirect('/login');
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">My Services</h1>
      <p>Services page coming soon...</p>
    </div>
  );
}