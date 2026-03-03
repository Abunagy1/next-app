// Layout component  will be shared across all pages and reshape the layout for your site main page
import Head from 'next/head';
import Image from 'next/image';
import styles from './layout.module.css';
import utilStyles from '../styles/utils.module.css';
//import utilStyles from '@/styles/utils.module.css';
import Link from 'next/link';
import { clsx } from 'clsx';
const name = 'The Blog';
/*  
The components/layout.tsx is a custom layout used by your blog pages (imported in app/blog/posts/[id]/page.tsx and app/blog/page.tsx).
It displays a header with a profile image and navigation.
*/
type LayoutProps = {
  children: React.ReactNode;
  home?: boolean;
  backHref?: string; // new optional prop
  backLabel?: string; // new prop for custom link text
};
export const siteTitle = 'Next.js Daynamic Website';
export function Alert({ children, type }) {
    return (
        <div
            className={clsx({
                [styles.success]: type === 'success',
                [styles.error]: type === 'error',
            })}
        >
            {children}
        </div>
    );
}
export default function Layout({ children, home, backHref, backLabel = "Back to home" }: LayoutProps) {
  return (
    <div className={styles.container}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta
          name="description"
          content="Learn how to build a personal website using Next.js"
        />
        <meta property="og:image" content={`https://og-image.vercel.app/${encodeURI(siteTitle)}.png?theme=light&md=0&fontSize=75px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fnextjs-black-logo.svg`} />
        <meta name="og:title" content={siteTitle} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <header className="mb-8 text-center md:text-left">
        {home ? (
          <div className="flex flex-col items-center">
            <Image
              priority
              src="/blog/blog.jpg"
              className="rounded-full border-4 border-blue-500 shadow-lg"
              height={144}
              width={144}
              alt=""
            />
            <h1 className="mt-4 text-4xl font-bold text-gray-900 dark:text-white">
              {name}
            </h1>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <Image
                priority
                src="/blog/post.jpg"
                className="rounded-full border-2 border-blue-500"
                height={48}
                width={48}
                alt=""
              />
              <span className="text-xl font-semibold text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {name}
              </span>
            </Link>
            {/* You could add other navigation items here if needed */}
          </div>
        )}
      </header>
      <main className="min-h-screen">{children}</main>
      {!home && (
        <footer className={styles.backToHome}>
          <Link
            href={backHref || '/'}
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← {backLabel}
          </Link>
        </footer>
      )}
    </div>
  );
}