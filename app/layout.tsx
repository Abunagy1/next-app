import { SessionProvider } from 'next-auth/react';
// This is called a root layout and is required in every Next.js application
// this file name indicate that it creates and control the UI layout of the main home / route page
// Any UI you add to this root layout will be shared across all pages in your application.
// i.e. Any components you import into this file will be part of the layout.
// You can use the root layout to modify your <html> and <body> tags, and add metadata
// and what it will be displayed here, it takes any children(ReactNode) component and display it.
import '@/app/ui/global.css'; // to add CSS rules to all the routes in your application
import { inter } from '@/app/ui/fonts'; //a Google primary font Class called Inter to pass it to the main <body> element of the application
//import { inter } from './ui/fonts';  // This imports from the ui subfolder
import { Metadata } from 'next';
// layout.tsx should now be at: /app/layout.tsx
//import './ui/global.css';  // This imports from the same folder
import ThemeToggle from '@/app/ui/theme-toggle';
import Link from 'next/link';
import HeaderNav from '@/app/ui/header-nav';
import ScrollToTop from '@/app/ui/scroll-to-top';
export const metadata: Metadata = {
  title: {
    template: '%s | NAGY Dashboard',
    default: 'NAGY Dashboard',
  },
  description: 'The Dashboard built with App Router.',
  metadataBase: new URL('https://next-learn-dashboard.vercel.sh'),
};
export default function RootLayout({
children,
}: {
  children: React.ReactNode;
}) {
  return ( // it return an html main page
    <html lang="en">
      <head>
        {/* Inline script to set the correct theme before React hydrates,
            preventing a flash of incorrect colors. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('theme');
                if (!theme) {
                  theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                if (theme === 'dark') document.documentElement.classList.add('dark');
              } catch (e) {}
            `,
          }}
        />
      </head>
      {/* add the Google fonts to the <body> element & the Tailwind antialiased class which smooths out the font, 
      By adding Inter to the <body> element, the font will be applied throughout your application */}
      {/* <body className={`${inter.className} antialiased`}>
        {/* Theme toggle button – fixed at top‑right, above all content 
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        {children}
      </body> */}
      <body className={`${inter.className} antialiased`}>
        <SessionProvider>
            <nav className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center space-x-8">
                    <Link href="/" className="text-xl font-bold text-gray-900 dark:text-white">
                      NAGY
                    </Link>
                    <HeaderNav />
                  </div>
                  <div className="flex items-center space-x-4">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </nav>
          <main>{children}</main>
          <ScrollToTop /> {/* ✅ Add this line */}
        </SessionProvider>
      </body>
    </html>
  );
}
