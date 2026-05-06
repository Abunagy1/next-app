// 'use server';
// import { cookies } from 'next/headers';
// import { revalidateTag } from 'next/cache';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/auth';
// import { dbType, sql, connectDB } from '@/app/lib/db/index';
// import dataModels from '@/app/lib/db/models';
// import { createOneDoc } from '@/app/lib/db/createOperationDB';
// import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
// import { getUserDetails } from '@/app/lib/services/user';
// import sendEmail from '@/app/lib/email/sendEmail';
// import emailConfirmationEmailTemplate from '@/app/lib/email/compiled/emailConfirmation.hbs';
// import emailDefaultData from '@/data/emailDefaultData';
// import { formatInTimeZone } from 'date-fns-tz';
// import { randomUUID } from 'crypto';
// import { strToObjectId } from '@/app/lib/db/utilsDB';

// export async function sendEmailConfimationLinkAction(prevState: any, formData: FormData) {
//   const email = formData instanceof FormData ? formData.get('email') as string : (formData as any).email;
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

//   const cookieStore = await cookies();
//   const saiCookie = cookieStore.get('sai');
//   if (saiCookie) {
//     const expiresAt = parseInt(saiCookie.value, 10);
//     const timeDiff = expiresAt - Date.now();
//     if (timeDiff > 0) {
//       const minutes = Math.floor(timeDiff / 60000);
//       const seconds = Math.floor((timeDiff % 60000) / 1000);
//       return {
//         success: false,
//         message: `Resend after ${minutes}m ${seconds}s`,
//       };
//     }
//   }

//   const user = await getUserDetails(session.user.id);
//   if (!user || Object.keys(user).length === 0) return { success: false, message: 'User not found' };
//   // Ensure emails array exists
//   const emails = user.emails || [];
//   const emailObj = emails.find((e: any) => e.email === email);
//   if (!emailObj) return { success: false, message: 'Email not found' };
//   if (emailObj.inVerification) return { success: false, message: 'Email already in verification' };
//   if (emailObj.emailVerifiedAt) return { success: false, message: 'Email already verified' };
//   const token = randomUUID();
//   const expires = new Date(Date.now() + 15 * 60 * 1000);
//   if (dbType === 'postgres') {
//     await sql`
//       INSERT INTO verification_tokens (identifier, token, expires)
//       VALUES (${email}, ${token}, ${expires})
//     `;
//     // Update the user's emails array (set inVerification true)
//     const updatedEmails = (user.emails || []).map((e: any) => {
//       if (e.email === email) {
//         return { ...e, inVerification: true };
//       }
//       return e;
//     });
//     await sql`
//       UPDATE users SET emails = ${JSON.stringify(updatedEmails)}::jsonb
//       WHERE id = ${session.user.id}
//     `;
//   } else {
//     await connectDB();
//     await createOneDoc('Verification_Token', { identifier: email, token, expires });
//     await updateOneDoc('User', { _id: strToObjectId(session.user.id), 'emails.email': email }, {
//       $set: { 'emails.$.inVerification': true },
//     });
//   }
//   const timeZone = cookieStore.get('timeZone')?.value || 'UTC';
//   const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/user/profile/confirm_email?token=${token}`;
//   const html = emailConfirmationEmailTemplate({
//     ...emailDefaultData,
//     main: {
//       verificationUrl,
//       expirationTime: formatInTimeZone(expires, timeZone, 'PPpp zzzz'),
//     },
//   });
//   await sendEmail([{ Email: email }] as any, 'Email Confirmation', html);
//   console.log('✅ Email sent to', email);
//   // Set sai cookie with expiration timestamp (2 minutes from now)
//   const saiExpires = Date.now() + 120 * 1000;
//   cookieStore.set('sai', String(saiExpires), {
//     maxAge: 120,
//     httpOnly: true,
//     sameSite: 'strict',
//   });
//   revalidateTag('userDetails', {});
//   return { success: true, message: 'Email sent successfully' };
// }
// app/lib/actions/sendEmailActions.ts
'use server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { createOneDoc } from '@/app/lib/db/createOperationDB';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { getUserDetails } from '@/app/lib/services/user';
import sendEmail from '@/app/lib/email/sendEmail';
import emailConfirmationEmailTemplate from '@/app/lib/email/compiled/emailConfirmation.hbs';
import emailDefaultData from '@/data/emailDefaultData';
import { formatInTimeZone } from 'date-fns-tz';
import { randomUUID } from 'crypto';
import { strToObjectId } from '@/app/lib/db/utilsDB';
export async function sendEmailConfimationLinkAction(prevState: any, formData: FormData) {
  const email = formData instanceof FormData ? formData.get('email') as string : (formData as any).email;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const cookieStore = await cookies();
  const saiCookie = cookieStore.get('sai');
  if (saiCookie) {
    const expiresAt = parseInt(saiCookie.value, 10);
    const timeDiff = expiresAt - Date.now();
    if (timeDiff > 0) {
      const minutes = Math.floor(timeDiff / 60000);
      const seconds = Math.floor((timeDiff % 60000) / 1000);
      return {
        success: false,
        message: `Resend after ${minutes}m ${seconds}s`,
      };
    }
  }
  const user = await getUserDetails(session.user.id);
  if (!user || Object.keys(user).length === 0) return { success: false, message: 'User not found' };
  // Ensure emails array exists
  const emails = user.emails || [];
  const emailObj = emails.find((e: any) => e.email === email);
  if (!emailObj) return { success: false, message: 'Email not found' };
  if (emailObj.inVerification) return { success: false, message: 'Email already in verification' };
  if (emailObj.emailVerifiedAt) return { success: false, message: 'Email already verified' };
  const token = randomUUID();
  const expires = new Date(Date.now() + 15 * 60 * 1000);
  // Insert verification token into database
  if (dbType === 'postgres') {
    await sql`
      INSERT INTO verification_tokens (identifier, token, expires)
      VALUES (${email}, ${token}, ${expires})
    `;
    const updatedEmails = (user.emails || []).map((e: any) => {
      if (e.email === email) {
        return { ...e, inVerification: true };
      }
      return e;
    });
    await sql`
      UPDATE users SET emails = ${JSON.stringify(updatedEmails)}::jsonb
      WHERE id = ${session.user.id}
    `;
  } else {
    await connectDB();
    await createOneDoc('Verification_Token', { identifier: email, token, expires });
    await updateOneDoc('User', { _id: strToObjectId(session.user.id), 'emails.email': email }, {
      $set: { 'emails.$.inVerification': true },
    });
  }
  // Prepare email HTML
  const timeZone = cookieStore.get('timeZone')?.value || 'UTC';
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/user/profile/confirm_email?token=${token}`;
  // ⚠️ Check that the template function exists
  if (typeof emailConfirmationEmailTemplate !== 'function') {
    console.error('❌ emailConfirmationEmailTemplate is not a function. Did you run "npm run precompile-hbs"?');
    return { success: false, message: 'Email template not ready. Please contact support.' };
  }
  let html: string;
  try {
    html = emailConfirmationEmailTemplate({
      ...emailDefaultData,
      main: {
        verificationUrl,
        expirationTime: formatInTimeZone(expires, timeZone, 'PPpp zzzz'),
      },
    });
  } catch (err) {
    console.error('❌ Error compiling email template:', err);
    return { success: false, message: 'Failed to prepare email content.' };
  }
  // Send email with error handling
  try {
    await sendEmail([{ Email: email }] as any, 'Email Confirmation', html);
    console.log('✅ Verification email sent to', email);
  } catch (error: any) {
    console.error('❌ Mailjet send error:', error);
    // Provide a more descriptive message based on error (optional)
    // You can inspect error.statusCode / error.message
    return {
      success: false,
      message: `Failed to send email: ${error.message || 'unknown error'}`,
    };
  }
  // Set sai cookie to prevent repeated clicks
  const saiExpires = Date.now() + 120 * 1000; // 2 minutes
  cookieStore.set('sai', String(saiExpires), {
    maxAge: 120,
    httpOnly: true,
    sameSite: 'strict',
  });
  revalidateTag('userDetails', {});
  return { success: true, message: 'Email sent successfully' };
}