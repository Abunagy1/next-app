import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import AddHotelForm from './AddHotelForm';

export default async function AddHotelPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') redirect('/dashboard');
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add New Hotel</h1>
      <AddHotelForm />
    </div>
  );
}