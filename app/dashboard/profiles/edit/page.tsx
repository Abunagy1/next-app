import { auth } from '@/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import ProfileForm from '@/app/ui/profiles/profile-form';
import { ProfileUser } from '@/app/lib/definitions';
export const dynamic = 'force-dynamic';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
export default async function EditProfilePage() {
  //const session = await auth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');
  const users = await sql<ProfileUser[]>`
    SELECT id, name, email, image, email_verified, phone, city, about, birth_date, role
    FROM users
    WHERE id = ${session.user.id}
  `;
  const user = users[0];
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <ProfileForm user={user} />
    </div>
  );
}