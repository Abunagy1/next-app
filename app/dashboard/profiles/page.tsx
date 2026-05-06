// app/dashboard/profiles/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import ProfileView from '@/app/ui/profiles/profile-view';
import { ProfileUser } from '@/app/lib/definitions';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import UserModel from '@/app/lib/db/models/User';
export const dynamic = 'force-dynamic';
export default async function ProfilePage() {
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
    const doc = await UserModel.findById(session.user.id).lean();
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
    redirect('/auth/signout?reason=deleted');
  }
  return <ProfileView user={user} />;
}