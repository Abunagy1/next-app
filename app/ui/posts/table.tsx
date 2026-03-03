'use client'
import Image from 'next/image';
import { UpdatePost, DeletePost } from '@/app/ui/posts/buttons';
import { formatDateToLocal } from '@/app/lib/utils';
//import { fetchFilteredPosts } from '@/app/lib/data';
import Link from 'next/link';

// ✅ Receive posts as props
export default function PostsTable({ posts }: { posts: any[] }) {
  //const posts = await fetchFilteredPosts(query, currentPage);
  return (
    <div className="mt-6 flow-root">
      <div className="inline-block min-w-full align-middle">
        <div className="rounded-lg bg-gray-50 p-2 md:pt-0 dark:bg-gray-900">
          {/* Mobile view */}
          <div className="md:hidden space-y-4">
            {posts?.map((post) => (
              <div
                key={post.slug}
                className="w-full rounded-md bg-white p-4 dark:bg-gray-800 shadow-sm"
              >
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex-1">
                    <div className="mb-1">
                      <Link
                        href={`/blog/posts/${post.slug}`}
                        className="text-lg font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {post.title}
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {post.content.substring(0, 80)}...
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDateToLocal(post.created_at)}
                  </p>
                  <div className="flex gap-3">
                    <UpdatePost id={post.slug} />
                    <DeletePost id={post.slug} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view with horizontal scroll if needed */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-gray-900 dark:text-gray-100 table-auto">
              <thead className="rounded-lg text-left text-base font-medium bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-4 w-1/4">Title</th>
                  <th scope="col" className="px-6 py-4 w-2/5">Content Preview</th>
                  <th scope="col" className="px-6 py-4 w-1/6">Created</th>
                  <th scope="col" className="px-6 py-4 w-1/6">Updated</th>
                  <th scope="col" className="px-6 py-4 w-1/12 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {posts?.map((post) => (
                  <tr key={post.slug} className="text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium">
                      <Link
                        href={`/blog/posts/${post.slug}`}
                        className="text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {post.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300 break-words">
                      {post.content.substring(0, 80)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {formatDateToLocal(post.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {post.updated_at ? formatDateToLocal(post.updated_at) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        <UpdatePost id={post.slug} />
                        <DeletePost id={post.slug} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}