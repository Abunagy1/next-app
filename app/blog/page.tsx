import { Metadata } from 'next';
import Head from 'next/head';
import Layout, { siteTitle } from '../../components/layout';
import utilStyles from '../../styles/utils.module.css';
//import { auth } from '@/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { getPosts } from '../lib/posts';
import BlogPostList from '../ui/posts/post-list';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Blog',
  description: 'Next.js blog posts',
};
export default async function BlogPage() {
  //const session = await auth();
  const session = await getServerSession(authOptions);
  //const posts = await getPosts(session?.user?.id);
  const posts = await getPosts(); // no argument → fetches all posts
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          {/* <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Blog</h1> */}
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Thoughts, stories, and ideas worth sharing.
          </p>
          {/* Create Post Button – only for logged-in users */}
          {session?.user && (
            <div className="mt-6">
              <Link
                href="/dashboard/posts/create"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                <PlusIcon className="w-5 h-5" />
                Create New Post
              </Link>
            </div>
          )}
        </div>
        <BlogPostList initialPosts={posts} isLoggedIn={!!session?.user} />
      </div>
    </Layout>
  );
}