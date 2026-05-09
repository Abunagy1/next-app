import 'server-only';
import { SubscribeNewsletter } from '@/components/SubscribeNewsletter';
import { QuickLinks } from '@/components/sections/QuickLinks';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import Link from 'next/link';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { Types } from 'mongoose';
export async function Footer() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  // let isSubscribed = false;
  // if (user?.id) {
  //   if (dbType === 'postgres') {
  //     const rows = await sql`
  //       SELECT 1 FROM subscriptions WHERE user_id = ${user.id} AND subscribed = true LIMIT 1
  //     `;
  //     isSubscribed = rows.length > 0;
  //   } else {
  //     await connectDB();
  //     const subscription = await dataModels.Subscription.findOne({
  //       userId: strToObjectId(user.id) as Types.ObjectId,
  //       subscribed: true,
  //     }).lean();
  //     isSubscribed = !!subscription;
  //   }
  // }
let isSubscribed = false;
if (user?.id) {
  if (dbType === 'postgres') {
    // Only query if the id looks like a valid UUID (avoids error)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(user.id)) {
      const rows = await sql`
        SELECT 1 FROM subscriptions WHERE user_id = ${user.id} AND subscribed = true LIMIT 1
      `;
      isSubscribed = rows.length > 0;
    }
  } else {
    await connectDB();
    const subscription = await dataModels.Subscription.findOne({
      userId: strToObjectId(user.id) as Types.ObjectId,
      subscribed: true,
    }).lean();
    isSubscribed = !!subscription;
  }
}
  return (
    
    <footer className="relative pb-5 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
      <SubscribeNewsletter isSubscribed={isSubscribed} />
      <QuickLinks />
      <div className="relative z-10 text-center text-sm font-medium">
        Developed by{' '}
        <Link
          aria-label="Link to Github of the developer"
          className="inline text-blue-600 dark:text-blue-400 hover:underline"
          href="https://github.com/Abunagy1"
          target="_blank"
          rel="noopener noreferrer"
        >
          M. Nagy
        </Link>
      </div>
      {/* <div className="relative z-10 text-center text-sm font-medium">
        UI design taken from &nbsp;
        <Link
          aria-label="Link to Figma Community"
          className="inline text-blue-600 dark:text-blue-400 hover:underline"
          href="https://www.figma.com/community/file/1182308758714734501/golobe-travel-agency-website"
          target="_blank"
          rel="noopener noreferrer"
        >
          Figma Community
        </Link>
      </div> */}
                <a
            href="https://github.com/Abungy1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="GitHub"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          </a>
          {/* Facebook */}
          <a
            href="https://www.facebook.com/mohamed.nagy.378199"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Facebook"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          {/* Twitter/X */}
          <a
            href="https://twitter.com/your-username"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Twitter"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>

          {/* LinkedIn */}
          <a
            href="https://www.linkedin.com/in/mohamed-nagy-18a30414a"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="LinkedIn"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>

          {/* Personal Website / Portfolio */}
          <a
            href="https://your-website.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Website"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 3v18M3 12h18"/></svg>
          </a>
      {/* Optional Footer Section */}
      <div className="relative z-10 text-center text-sm font-medium mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
        <p>&copy; {new Date().getFullYear()} OldNagy. All Rights Reserved.</p>
      </div> 
    </footer>
  );
}