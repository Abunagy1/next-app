'use server';
import { cookies } from 'next/headers';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { deleteOneDoc } from '@/app/lib/db/deleteOperationDB';
import { createOneDoc } from '@/app/lib/db/createOperationDB';
import sendEmail from '@/app/lib/email/sendEmail';
import { passwordResetVerificationEmailTemplate } from '@/app/lib/email/templates';
import emailDefaultData from '@/data/emailDefaultData';
import { formatInTimeZone } from 'date-fns-tz';
import routes from '@/data/routes.json';

export default async function resendCodeAction() {
  const cookieStore = await cookies();
  const vdStr = cookieStore.get('vd')?.value;
  const eiStr = cookieStore.get('e_i')?.value;
  if (!vdStr && eiStr) {
    return { success: false, message: `Already verified. Go to ${routes['set-new-password'].path}` };
  }
  if (!vdStr) return { success: false, message: 'Code expired, resend new code' };

  const vdObj = JSON.parse(vdStr);
  let userId: string;
  let userEmail: string;

  if (dbType === 'postgres') {
    const rows = await sql`SELECT id, email FROM users WHERE id = ${vdObj.id}`;
    if (!rows.length) return { success: false, error: { email: 'User not found' } };
    userId = rows[0].id;
    userEmail = rows[0].email;
  } else {
    await connectDB();
    const user = await dataModels.User.findById(vdObj.id).lean();
    if (!user) return { success: false, error: { email: 'User not found' } };
    userId = user._id.toString();
    userEmail = user.email;
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  if (dbType === 'postgres') {
    await sql`DELETE FROM verification_tokens WHERE identifier = ${userId}`;
    await sql`INSERT INTO verification_tokens (identifier, token, expires) VALUES (${userId}, ${code}, ${expires})`;
  } else {
    await deleteOneDoc('Verification_Token', { identifier: userId });
    await createOneDoc('Verification_Token', { identifier: userId, token: code, expires });
  }

  const timeZone = cookieStore.get('timeZone')?.value || 'UTC';
  const html = passwordResetVerificationEmailTemplate({
    ...emailDefaultData,
    main: { code, expirationTime: formatInTimeZone(expires, timeZone, 'PPpp zzzz') },
  });
  await sendEmail([{ Email: userEmail }] as any, 'Password Reset Verification Code', html);

  cookieStore.set('vd', JSON.stringify({ id: userId, email: userEmail }), {
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    secure: true,
  });
  return { success: true, message: 'Code resent' };
}