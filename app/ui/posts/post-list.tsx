'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import DateComponent from '@/components/date';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Post } from '@/app/lib/definitions'; // ✅ full type with content & images

export default function BlogPostList({ initialPosts, isLoggedIn }: { initialPosts: Post[]; isLoggedIn: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const filteredPosts = initialPosts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (initialPosts.length === 0) {
    return (
      <section className="text-center py-16">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">No Posts Yet</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {isLoggedIn
            ? "You haven't created any posts yet."
            : "No posts available. Check back later!"}
        </p>
        {isLoggedIn && (
          <Link
            href="/dashboard/posts/create"
            className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Create Your First Post
          </Link>
        )}
      </section>
    );
  }

  return (
    <section>
      {/* Search Bar */}
      <div className="relative max-w-md mx-auto mb-12">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search posts by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPosts.map((post) => {
          const imageUrl = post.images && post.images.length > 0 ? post.images[0] : null;
          return (
            <Link
              key={post.slug}
              href={`/blog/posts/${post.slug}`}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col"
            >
              {/* Image / Placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-indigo-500 relative">
                {imageUrl ? (
                  <Image src={imageUrl} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt={post.title} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold opacity-20">
                    {post.title.charAt(0)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <DateComponent dateString={post.created_at} />
                </p>

                {/* Content Preview (strip basic Markdown, truncate) */}
                {post.content && (
                  <p className="text-gray-600 dark:text-gray-300 mt-3 line-clamp-3">
                    {post.content.replace(/[#*`]/g, '').substring(0, 120)}...
                  </p>
                )}ƒ
              </div>
            </Link>
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400 mt-8">
          No posts match your search.
        </p>
      )}
    </section>
  );
}