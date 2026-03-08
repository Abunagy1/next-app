'use client'
import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { deletePost } from '@/app/lib/actions';

export function CreatePost() {
  return (
    <Link
      href="/dashboard/posts/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Post</span>{' '}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdatePost({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/posts/${id}`}
      className="rounded-md border-2 p-2 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeletePost({ id }: { id: string }) {
  const deletePostWithId = deletePost.bind(null, id);
  return (
    <form action={deletePostWithId}>
      <button
        type="submit"
        className="rounded-md border-2 p-2 hover:bg-gray-200 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <TrashIcon className="w-5" />
      </button>
    </form>
  );
}