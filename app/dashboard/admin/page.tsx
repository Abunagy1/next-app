import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import AdminUserTable from '../../ui/admin/user-table';
import { User } from '@/app/lib/definitions'; // ✅ Import User type
export const dynamic = 'force-dynamic';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
export default async function AdminPage() {
  const session = await auth();
  if (session?.user?.role !== 'admin') {
    redirect('/dashboard');
  }
  const users = await sql<User[]>`
    SELECT id, name, email, role, email_verified, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-4">Admin Panel – Manage Users</h1>
      <AdminUserTable users={users} />
    </div>
  );
}