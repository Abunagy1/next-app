// app/dashboard/profiles/edit/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import ProfileForm from '@/app/ui/profiles/profile-form';
import { ProfileUser } from '@/app/lib/definitions';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
export const dynamic = 'force-dynamic';
export default async function EditProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/user/login');
  let user: ProfileUser | null = null;
  if (dbType === 'postgres') {
    const users = await sql<ProfileUser[]>`
      SELECT id, name, email, image, email_verified, phone, city, about, birth_date, role
      FROM users
      WHERE id = ${session.user.id}
    `;
    user = users[0] || null;
  } else {
    await connectDB();
    const doc = await dataModels.User.findById(session.user.id).lean();
    if (doc) {
      user = {
        id: doc._id.toString(),
        name: doc.name,
        email: doc.email,
        image: doc.image,
        email_verified: doc.email_verified,
        phone: doc.phone,
        city: doc.city,
        about: doc.about,
        birth_date: doc.birth_date ? doc.birth_date.toISOString().split('T')[0] : null,
        role: doc.role,
      };
    }
  }
  if (!user) {
    redirect('/user/login?error=usernotfound');
  }
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <ProfileForm user={user} />
    </div>
  );
}