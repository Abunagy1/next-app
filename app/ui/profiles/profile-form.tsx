'use client';
import { useActionState, useState } from 'react';
import { updateProfile, deleteAccount } from '@/app/lib/actions';
import { Button } from '@/app/ui/button';
import { AvatarUpload } from '../upload-button';
import Image from 'next/image';
import { ProfileUser } from '@/app/lib/definitions';
export default function ProfileForm({ user }: { user: ProfileUser }) {
  const [avatarUrl, setAvatarUrl] = useState(user.image || '');
  const [updateState, updateAction, updatePending] = useActionState(updateProfile, undefined);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccount, undefined);
  return (
    <>
      <form action={updateAction} className="space-y-6">
        <input type="hidden" name="image" value={avatarUrl} />
        {/* Avatar */}
        <div className="flex items-center space-x-4">
          {avatarUrl && (
            <Image src={avatarUrl} alt="Avatar" width={80} height={80} className="rounded-full object-cover" />
          )}
          <AvatarUpload onUploadComplete={(url) => setAvatarUrl(url)} />
        </div>
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            defaultValue={user.name}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
            required
          />
        </div>
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={user.email}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
            required
          />
          {!user.email_verified && (
            <p className="text-sm text-amber-600 mt-1">Email not verified. Check your inbox.</p>
          )}
        </div>
        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            defaultValue={user.phone || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium">City</label>
          <input
            type="text"
            id="city"
            name="city"
            defaultValue={user.city || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        {/* Birth Date */}
        <div>
          <label htmlFor="birth_date" className="block text-sm font-medium">Birth Date</label>
          <input
            type="date"
            id="birth_date"
            name="birth_date"
            defaultValue={user.birth_date || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        {/* About */}
        <div>
          <label htmlFor="about" className="block text-sm font-medium">About</label>
          <textarea
            id="about"
            name="about"
            rows={4}
            defaultValue={user.about || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-800 dark:border-gray-600"
          />
        </div>
        {updateState && (
          <p className={`text-sm ${updateState.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
            {updateState}
          </p>
        )}
        <Button type="submit" aria-disabled={updatePending}>
          Update Profile
        </Button>
      </form>
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Once you delete your account, there is no going back. All your posts will be removed.
        </p>
        <form action={deleteAction} className="mt-4">
          <Button type="submit" className="bg-red-600 hover:bg-red-700" aria-disabled={deletePending}>
            Delete Account
          </Button>
          {deleteState && <p className="text-sm text-red-500 mt-2">{deleteState}</p>}
        </form>
      </div>
    </>
  );
}