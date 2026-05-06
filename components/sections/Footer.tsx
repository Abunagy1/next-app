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
  let isSubscribed = false;

  if (user?.id) {
    if (dbType === 'postgres') {
      const rows = await sql`
        SELECT 1 FROM subscriptions WHERE user_id = ${user.id} AND subscribed = true LIMIT 1
      `;
      isSubscribed = rows.length > 0;
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
      <div className="relative z-10 text-center text-sm font-medium">
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
      </div>
      {/* Optional Footer Section */}
      <div className="relative z-10 text-center text-sm font-medium mt-8 border-t border-gray-200 dark:border-gray-700 pt-4">
        <p>&copy; {new Date().getFullYear()} OldNagy. All Rights Reserved.</p>
      </div> 
    </footer>
  );
}