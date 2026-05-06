import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
interface LayoutProps {
  children: ReactNode;
  home?: boolean;
}
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