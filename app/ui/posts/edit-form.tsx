'use client';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { updatePost, deletePost } from '@/app/lib/actions';
import { useActionState, useState } from 'react';
import { ArrowLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UploadButton } from '@uploadthing/react';
import type { ourFileRouter } from '@/app/api/uploadthing/core';
import Image from 'next/image';
// const uploadButtonAppearance = {
//   button: {
//     background: 'transparent',
//     border: '2px solid #3b82f6', // blue-500
//     borderRadius: '0.5rem',
//     padding: '0.5rem 1rem',
//     color: '#3b82f6',
//     fontWeight: '500',
//     transition: 'all 0.2s',
//     cursor: 'pointer',
//     width: '100%',
//   },
//   allowedContent: {
//     color: '#6b7280', // gray-500
//     fontSize: '0.875rem',
//   },
// };
export type UserField = {
  id: string;
  name: string;
};
export type PostForm = {
  id: string;
  user_id: string;
  title: string;
  subject: string;
};
// export type State = {
//   errors?: {
//     customerId?: string[];
//     amount?: string[];
//     status?: string[];
//   };
//   message?: string | null;
// };

// you want to pass the id to the Server Action so you can update the right record in your database.
// You cannot pass the id as an argument like so:
// <form action={updatePost(id)}> Passing an id as argument won't work
// Instead, you can pass id to the Server Action using JS bind
// This will ensure that any values passed to the Server Action are encoded.
type EditPostFormProps = {
  post: {
    slug: string;
    title: string;
    content: string;
    images?: string[]; // Include images
  };
};
export default function EditPostForm({ post }: EditPostFormProps) {
  const [imageUrls, setImageUrls] = useState<string[]>(post.images || []);
  const updatePostWithId = updatePost.bind(null, post.slug);
  const [errorMessage, formAction, isPending] = useActionState(
    updatePostWithId,
    undefined
  );
  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== indexToRemove));
  };
  const handleDelete = async (e: React.MouseEvent) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      e.preventDefault();
      return;
    }
    // If confirmed, navigate to the delete route
    // We'll use a form to POST, or you can use fetch
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `/dashboard/posts/${post.slug}/delete`;
    document.body.appendChild(form);
    form.submit();
  };
  return (
    <form action={formAction} className="space-y-6">
      <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {/* Title */}
        <div className="mb-5">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={post.title}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>
        {/* Image Upload */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Images
          </label>
          <div className="space-y-3">
            {/* Existing images preview */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                {imageUrls.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <Image
                      src={url}
                      alt={`Post image ${idx + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                      title="Remove image"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    <input type="hidden" name="images" value={url} />
                  </div>
                ))}
              </div>
            )}
            {/* Upload new images – styled button */}
            <div className="flex items-center justify-center w-full">
              <UploadButton<typeof ourFileRouter, 'postImageUploader'>
                endpoint="postImageUploader"
                onClientUploadComplete={(res) => {
                  const urls = res?.map((file) => file.ufsUrl) || [];
                  setImageUrls(prev => [...prev, ...urls]);
                }}
                onUploadError={(error: Error) => {
                  alert(`Upload failed: ${error.message}`);
                }}
                appearance={{
                  button: {
                    background: 'transparent',
                    border: '2px solid #3b82f6', // blue-500
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    color: '#3b82f6',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                    width: '100%',
                  },
                  allowedContent: {
                    color: '#6b7280', // gray-500
                    fontSize: '0.875rem',
                  },
                }}
                // appearance={uploadButtonAppearance}
              />
            </div>
          </div>
        </div>
        {/* Content */}
        <div className="mb-5">
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Content (Markdown)
          </label>
          <textarea
            id="content"
            name="content"
            rows={12}
            defaultValue={post.content}
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-mono text-sm"
          />
        </div>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
          </div>
        )}
      </div>
      {/* Form Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/posts"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving...' : 'Update Post'}
          </Button>
        </div>
        {/* Delete Post Button */}
        {/* <form action={deletePost.bind(null, post.slug)}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            onClick={(e) => {
              if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
                e.preventDefault();
              }
            }}
          >
            <TrashIcon className="w-4 h-4" />
            Delete Post
          </button>
        </form> */}
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
          >
            <TrashIcon className="w-4 h-4" />
            Delete Post
          </button>
      </div>
    </form>
  );
}