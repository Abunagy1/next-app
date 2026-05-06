import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getUserDetails } from '@/app/lib/services/user';
import { cn } from '@/app/lib/utils';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUserDetails(id);

  if (!user || Object.keys(user).length === 0) {
    notFound();
  }

  const profileImage = user.image ?? '/default-avatar.png';
  const coverImage = user.coverImage ?? null;

  return (
    <main className="mx-auto my-12 w-[95%] max-w-3xl text-secondary dark:text-gray-200">
      {/* Cover photo */}
      {coverImage && (
        <div className="relative h-48 md:h-64 rounded-xl overflow-hidden shadow-md mb-6">
          <Image
            src={coverImage}
            alt="Cover photo"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* Profile header */}
      <div className="flex flex-col items-center md:flex-row md:items-center gap-6">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-lg bg-white dark:bg-gray-800">
          <Image
            src={profileImage}
            alt={`${user.firstName} ${user.lastName}`}
            width={128}
            height={128}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-bold dark:text-white">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
        </div>
      </div>

      {/* Details card */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold dark:text-white">About</h2>
          <p className="mt-1 dark:text-gray-300">{user.about || 'No information provided.'}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium dark:text-white">City</h3>
            <p className="dark:text-gray-300">{user.city || 'Not specified'}</p>
          </div>
          <div>
            <h3 className="font-medium dark:text-white">Birth Date</h3>
            <p className="dark:text-gray-300">
              {user.birth_date ? new Date(user.birth_date).toLocaleDateString() : 'Not provided'}
            </p>
          </div>
          <div className="sm:col-span-2">
            <h3 className="font-medium dark:text-white">Contact</h3>
            <p className="dark:text-gray-300">
              Email: <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline dark:text-blue-400">{user.email}</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}