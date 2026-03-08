import Pagination from '@/app/ui/posts/pagination';
import Search from '@/app/ui/search';
import { CreatePost } from '@/app/ui/posts/buttons';
import { lusitana } from '@/app/ui/fonts';
import { PostsTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { Metadata } from 'next';
import {
  fetchPostsPages,
  fetchPostsPagesByUser,
  fetchFilteredPosts,
  fetchFilteredPostsByUser,
} from '@/app/lib/data';
import PostsTable from '@/app/ui/posts/table';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Posts',
};

export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const deleted = searchParams?.deleted;
  const error = searchParams?.error;
  
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === 'admin';

  let totalPages: number;
  let posts: any[];

  if (isAdmin) {
    // Admin sees all posts
    totalPages = await fetchPostsPages(query);
    posts = await fetchFilteredPosts(query, currentPage);
  } else {
    if (!userId) {
      // Should not happen because middleware protects dashboard, but handle gracefully
      totalPages = 0;
      posts = [];
    } else {
      totalPages = await fetchPostsPagesByUser(userId, query);
      posts = await fetchFilteredPostsByUser(userId, query, currentPage);
    }
  }

  return (
    <div className="w-full">
      {deleted && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          Post deleted successfully!
        </div>
      )}
      {error === 'unauthorized' && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          You don't have permission to delete this post.
        </div>
      )}
      {error === 'notfound' && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          Post not found.
        </div>
      )}
      {error === 'failed' && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          Failed to delete post. Please try again.
        </div>
      )}
      {/* rest of your JSX */}
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Posts</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search posts..." />
        <CreatePost />
      </div>
      <Suspense key={query + currentPage} fallback={<PostsTableSkeleton />}>
        <PostsTable posts={posts} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}