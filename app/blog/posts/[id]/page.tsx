import Head from 'next/head';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Layout from '@/components/layout';
import Date from '@/components/date';
import utilStyles from '@/styles/utils.module.css';
import Link from 'next/link';
import { auth } from '@/auth';
import { getAllPostIds, getPostData, getSortedPostsData } from '@/app/lib/posts';
import { PencilIcon, ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const paths = await getAllPostIds();
  return paths.map((path) => ({ id: path.params.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const postData = await getPostData(id);
  if (!postData) return { title: 'Post Not Found' };
  return {
    title: postData.title,
    description: postData.contentHtml.replace(/<[^>]*>/g, '').substring(0, 160),
  };
}



export default async function Post({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const backLink = session ? '/dashboard' : '/';
  const backLabel = session ? 'Back to Dashboard' : 'Back to Home';

  const allPosts = await getSortedPostsData();
  let postData;
  try {
    postData = await getPostData(id);
    if (!postData) notFound();
  } catch {
    notFound();
  }

  // Check if user can edit (author or admin)
  const canEdit = session?.user && (
    session.user.id === postData.user_id || session.user.role === 'admin'
  );

  const currentIndex = allPosts.findIndex(post => post.slug === id);
  const prevPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return (
    <Layout backHref={backLink} backLabel={backLabel}>
      <Head>
        <title>{postData.title}</title>
      </Head>
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with title and edit button */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
              {postData.title}
            </h1>
            {canEdit && (
              <Link
                href={`/dashboard/posts/${id}`}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                title="Edit post"
              >
                <PencilIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Edit Post</span>
              </Link>
            )}
          </div>
          <div className="flex items-center text-gray-600 dark:text-gray-400 mt-2">
            <Date dateString={postData.created_at} />
          </div>
        </header>

        {/* Images at the top (if any) */}
        {postData.images && postData.images.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {postData.images.map((url, idx) => (
              <div key={idx} className="relative h-64 md:h-80 rounded-xl overflow-hidden shadow-lg">
                <Image
                  src={url}
                  alt={`Post image ${idx + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
        />

        {/* Navigation between posts */}
        <nav className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          {prevPost ? (
            <Link
              href={`/blog/posts/${prevPost.slug}`}
              className="group flex items-center text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              <div>
                <div className="text-sm">Previous</div>
                <div className="font-medium">{prevPost.title}</div>
              </div>
            </Link>
          ) : <div />}
          {nextPost ? (
            <Link
              href={`/blog/posts/${nextPost.slug}`}
              className="group flex items-center text-right text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
            >
              <div>
                <div className="text-sm">Next</div>
                <div className="font-medium">{nextPost.title}</div>
              </div>
              <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : <div />}
        </nav>
      </article>
    </Layout>
  );
}