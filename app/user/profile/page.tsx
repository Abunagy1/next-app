import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { ProfileImages } from '@/components/pages/profile/ProfileImages';
import { ProfileData } from '@/components/pages/profile/ProfileData';
import { getUserDetails } from '@/app/lib/services/user';
import { format } from 'date-fns';
import routes from '@/data/routes.json';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function ProfilePage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`${routes.login.path}?callbackPath=${encodeURIComponent(routes.profile.path)}`);
  }
  const userDetails = await getUserDetails(session.user.id);
  if (!userDetails) {
    redirect(routes.login.path);
  }
  const params = await searchParams;
  return (
    <main className="mx-auto mb-[90px] w-[95%] sm:w-[90%]">
    <div className="flex justify-end">
      <Button asChild>
        <Link href="/user/settings?tab=profile">Edit Profile</Link>
      </Button>
    </div>
      <ProfileImages
        image={userDetails.image || ''}
        cover={userDetails.coverImage || ''}
        name={`${userDetails.firstName} ${userDetails.lastName}`}
        email={userDetails.email}
      />
      <ProfileData
        tab={params?.tab}
        userDetails={{
          ...userDetails,
          dateOfBirth: userDetails.birth_date
            ? format(new Date(userDetails.birth_date), 'dd MMM yyyy')
            : null,
        }}
      />
    </main>
  );
}