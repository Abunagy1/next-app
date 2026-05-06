'use server';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { createOneDoc } from '@/app/lib/db/createOperationDB';

export default async function subscribeAction(prevState: any, formData: FormData) {
  const email = formData.get('subscribe-email') as string;
  if (!email?.trim()) return { success: false, error: 'Provide Email' };

  let exists: boolean;
  if (dbType === 'postgres') {
    const rows = await sql`SELECT id FROM subscriptions WHERE email = ${email.trim()}`;
    exists = rows.length > 0;
  } else {
    await connectDB();
    exists = !!(await dataModels.Subscription.exists({ email: email.trim() }));
  }
  if (exists) return { success: false, error: 'You already subscribed' };

  let userId: string | null = null;
  let emailVerified: Date | null = null;
  if (dbType === 'postgres') {
    const user = await sql`SELECT id, email_verified_at FROM users WHERE email = ${email.trim()}`;
    if (user.length) {
      userId = user[0].id;
      emailVerified = user[0].email_verified_at;
    }
  } else {
    await connectDB();
    const user = await getOneDoc('User', { email: email.trim() }, ['userDetails'], 0);
    if (Object.keys(user).length) {
      userId = user._id.toString();
      emailVerified = user.emailVerifiedAt;
    }
  }

  const subscriptionData = { email: email.trim(), userId, emailVerified, subscribed: true };
  if (dbType === 'postgres') {
    await sql`
      INSERT INTO subscriptions (email, user_id, email_verified, subscribed)
      VALUES (${subscriptionData.email}, ${subscriptionData.userId}, ${subscriptionData.emailVerified}, true)
    `;
  } else {
    await createOneDoc('Subscription', subscriptionData);
  }
  return { success: true, message: 'Subscribed!! Thank you.' };
}