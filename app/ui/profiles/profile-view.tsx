'use client';
import Image from 'next/image';
import Link from 'next/link';
import { PencilIcon } from '@heroicons/react/24/outline';
import { ProfileUser } from '@/app/lib/definitions';
export default function ProfileView({ user }: { user: ProfileUser }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Profile</h1>
        <Link
          href="/dashboard/profiles/edit"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <PencilIcon className="h-4 w-4" />
          Edit Profile
        </Link>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center space-x-4">
          {user.image && (
            <Image
              src={user.image}
              alt="Avatar"
              width={80}
              height={80}
              className="rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
            {!user.email_verified && (
              <p className="text-sm text-amber-600">Email not verified</p>
            )}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
            <p className="text-gray-900 dark:text-white">{user.phone || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">City</p>
            <p className="text-gray-900 dark:text-white">{user.city || '—'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Birth Date</p>
            <p className="text-gray-900 dark:text-white">
              {user.birth_date ? new Date(user.birth_date).toLocaleDateString() : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
            <p className="capitalize text-gray-900 dark:text-white">{user.role || 'user'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">About</p>
            <p className="text-gray-900 dark:text-white">{user.about || '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}