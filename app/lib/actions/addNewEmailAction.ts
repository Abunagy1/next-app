'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { z } from 'zod';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { revalidateTag } from 'next/cache';
export async function addNewEmailAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const data = Object.fromEntries(formData);
  const schema = z.object({ email: z.string().email('Invalid email').min(1, 'Email is required') }).safeParse(data);
  if (!schema.success) {
    const errors: any = {};
    schema.error.issues.forEach((issue) => {
      errors[issue.path[0]] = issue.message;
    });
    return { success: false, error: errors };
  }
  const email = schema.data.email;
  try {
    if (dbType === 'postgres') {
      // Check if email already exists for this user
      const existing = await sql`SELECT id FROM user_emails WHERE user_id = ${session.user.id} AND email = ${email}`;
      if (existing.length) {
        return { success: false, error: { email: 'Email already exists' } };
      }
      await sql`
        INSERT INTO user_emails (user_id, email, is_primary, email_verified)
        VALUES (${session.user.id}, ${email}, false, false)
      `;
    } else {
      await connectDB();
      const user = await getOneDoc('User', { _id: strToObjectId(session.user.id) });
      if (user.emails?.some((e: any) => e.email === email)) {
        return { success: false, error: { email: 'Email already exists' } };
      }
      await updateOneDoc('User', { _id: strToObjectId(session.user.id) }, {
        $push: { emails: { email, emailVerifiedAt: null, primary: false, inVerification: false } }
      });
    }
    revalidateTag('userDetails', {});
    return { success: true, message: 'New email added successfully' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to add new email' };
  }
}