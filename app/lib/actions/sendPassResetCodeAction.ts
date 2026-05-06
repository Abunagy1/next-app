'use server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { deleteOneDoc } from '@/app/lib/db/deleteOperationDB';
import { createOneDoc } from '@/app/lib/db/createOperationDB';
import sendEmail from '@/app/lib/email/sendEmail';
import { passwordResetVerificationEmailTemplate } from '@/app/lib/email/templates';
import emailDefaultData from '@/data/emailDefaultData';
import { formatInTimeZone } from 'date-fns-tz';
import routes from '@/data/routes.json';
export default async function sendPassResetCodeAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const parsed = z.object({ email: z.string().email() }).safeParse({ email });
  if (!parsed.success) {
    return { success: false, error: { email: 'Invalid email address' } };
  }
  let user: any = null;
  if (dbType === 'postgres') {
    const rows = await sql`SELECT id, email FROM users WHERE email = ${email}`;
    if (rows.length) user = rows[0];
  } else {
    await connectDB();
    user = await dataModels.User.findOne({ email }).lean();
  }
  if (!user) {
    return { success: false, error: { email: 'User not found' } };
  }
  const cookieStore = await cookies();
  cookieStore.delete('vd');
  cookieStore.delete('e_i');
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  let tokenDoc: any;
  if (dbType === 'postgres') {
    await sql`DELETE FROM verification_tokens WHERE identifier = ${user.id}`;
    await sql`
      INSERT INTO verification_tokens (identifier, token, expires)
      VALUES (${user.id}, ${verificationCode}, ${expires})
    `;
    tokenDoc = { token: verificationCode, expires };
  } else {
    await deleteOneDoc('Verification_Token', { identifier: user.id });
    tokenDoc = await createOneDoc('Verification_Token', {
      identifier: user.id,
      token: verificationCode,
      expires,
    });
  }
  const timeZone = cookieStore.get('timeZone')?.value || 'UTC';
  const html = passwordResetVerificationEmailTemplate({
    ...emailDefaultData,
    main: {
      code: tokenDoc.token,
      expirationTime: formatInTimeZone(tokenDoc.expires, timeZone, 'PPpp zzzz'),
    },
  });
  // ✅ Cast recipient array to any to satisfy TypeScript
  await sendEmail([{ Email: user.email }] as any, 'Password Reset Verification Code', html);
  cookieStore.set('vd', JSON.stringify({ id: user.id, email: user.email }), {
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    secure: true,
  });
  redirect(routes['verify-password-reset-code'].path + '?sent=true');
}