import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
interface LayoutProps {
  children: ReactNode;
  home?: boolean;
}
// To load global CSS to your application, create a file called pages/_app.js with the following content:
//a top-level React component that wraps all the pages in your application.
//You can use this component to keep state when navigating between pages, or to add global styles as we're doing here
// `pages/_app.js`
// import '../styles/global.css';// to add CSS rules to all the routes in your application
// export default function App({ Component, pageProps }) {
//     return <Component {...pageProps} />;
// }
export default function BlogLayout({ children, home = false }: LayoutProps) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <header className="mb-8">
        {home ? (
          <>
            <Image
              priority
              src="/blog/post.jpg"
              height={144}
              width={144}
              alt="Profile"
              className="rounded-full mx-auto"
            />
            <h1 className="text-4xl font-bold text-center mt-4">Your Name</h1>
          </>
        ) : (
          <nav className="mb-4">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              ← Back to home
            </Link>
          </nav>
        )}
      </header>
      <main>{children}</main>
      {!home && (
        <div className="mt-8 pt-4 border-t">
          <Link 
            href="/" 
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to home
          </Link>
        </div>
        
      )}
    </div>
  );
}