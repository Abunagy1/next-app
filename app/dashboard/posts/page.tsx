
import Pagination from '@/app/ui/posts/pagination';
import Search from '@/app/ui/search';
import { CreatePost } from '@/app/ui/posts/buttons';
import { lusitana } from '@/app/ui/fonts';
import { PostsTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { Metadata } from 'next';
import { fetchPostsPages } from '@/app/lib/data';
import PostsTable from '@/app/ui/posts/table';
import { fetchFilteredPosts } from '@/app/lib/data'; // ✅ still used here (server)
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Posts',
};
export default async function Page(props: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchPostsPages(query);
    // ✅ Fetch data on the server
  const posts = await fetchFilteredPosts(query, currentPage);
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Posts</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search placeholder="Search posts..." />
        <CreatePost />
      </div>
      <Suspense key={query + currentPage} fallback={<PostsTableSkeleton />}>
        {/* <PostsTable query={query} currentPage={currentPage} /> */}
        {/* ✅ Pass data as props */}
        <PostsTable posts={posts} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}