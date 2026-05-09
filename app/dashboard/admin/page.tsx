import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import AdminUserTable from '../../ui/admin/user-table';
import { User } from '@/app/lib/definitions';
import { sql, mongoose, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
export const dynamic = 'force-dynamic';
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    redirect('/dashboard');
  }
  let users: User[];
  if (dbType === 'postgres') {
    users = await sql<User[]>`
      SELECT id, name, email, role, email_verified, created_at
      FROM users
      ORDER BY created_at DESC
    `;
  } else {
    await connectDB();
    const docs = await dataModels.User.find().sort({ created_at: -1 }).lean();
    users = docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      role: doc.role,
      email_verified: doc.email_verified,
      created_at: doc.created_at?.toISOString(),
    })) as User[];
  }
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">Admin Panel -- Manage Users</h1>
      <AdminUserTable users={users} />
    </div>
  );
}