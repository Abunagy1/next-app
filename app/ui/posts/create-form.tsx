'use client';
import Link from 'next/link';
import { Button } from '@/app/ui/button';
import { createPost } from '@/app/lib/actions';
import { useActionState, useState } from 'react';
import { UploadButton } from '@uploadthing/react';
import type { ourFileRouter } from '@/app/api/uploadthing/core';
import Image from 'next/image';
export default function CreatePostForm() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [errorMessage, formAction, isPending] = useActionState(createPost, undefined);
  return (
    <form action={formAction}>
      <div className="rounded-md bg-gray-50 p-4 md:p-6 dark:bg-gray-800">
        {/* Title */}
        <div className="mb-4">
          <label htmlFor="title" className="mb-2 block text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="Enter post title"
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            required
          />
        </div>
        {/* Image Upload */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium">
            Images (optional)
          </label>
          <UploadButton<typeof ourFileRouter, 'postImageUploader'>
            endpoint="postImageUploader"
            onClientUploadComplete={(res) => {
              const urls = res?.map((file) => file.ufsUrl) || []; // ✅ using ufsUrl
              setImageUrls(prev => [...prev, ...urls]);
            }}
            onUploadError={(error: Error) => {
              alert(`ERROR! ${error.message}`);
            }}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {imageUrls.map((url, idx) => (
              <div key={idx} className="relative w-20 h-20">
                <Image src={url} alt={`Upload ${idx}`} fill className="object-cover rounded" />
                <input type="hidden" name="images" value={url} />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <label htmlFor="content" className="mb-2 block text-sm font-medium">
            Content (Markdown)
          </label>
          <textarea
            id="content"
            name="content"
            rows={10}
            placeholder="Write your post in Markdown..."
            className="peer block w-full rounded-md border border-gray-200 py-2 pl-10 text-sm outline-2 placeholder:text-gray-500"
            required
          />
        </div>

        {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <Link
          href="/dashboard/posts"
          className="flex h-10 items-center rounded-lg bg-gray-100 px-4 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200"
        >
          Cancel
        </Link>
        <Button type="submit" aria-disabled={isPending}>
          Create Post
        </Button>
      </div>
    </form>
  );
}