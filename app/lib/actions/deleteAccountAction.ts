'use server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
//import { auth } from '@/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { deleteManyDocs, deleteOneDoc } from '@/app/lib/db/deleteOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import { createAnalytics, incOrDecrementAnalytics } from '@/app/lib/services/analytics';
import { getUserDetails } from '@/app/lib/services/user';
import initStripe from '@/app/lib/paymentIntegration/stripe';
import mongoose from 'mongoose';
import { Types } from 'mongoose';
export async function deleteAccountAction(prevState: string | undefined, formData: FormData): Promise<string | undefined> {
  //const session = await auth();
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) //return { success: false, message: 'Unauthenticated' };
    return 'Unauthorized';
  if (session.user.role === 'admin') {
    return 'Admin accounts cannot be deleted.';
  }
  const schema = z.object({
    primaryEmail: z.string().email(),
    password: z.string().min(1),
    delete: z.literal('DELETE'),
  });
  const parsed = schema.safeParse(Object.fromEntries(formData));
  // if (!parsed.success) {
  //   const errors = parsed.error.issues.map(issue => issue.message).join(', ');
  //   return errors;
  // }
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach(issue => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    //return { success: false, error: errors };
    return 'Invalid input data';
  }
  const { primaryEmail, password } = parsed.data;
  if (primaryEmail !== session.user.email) {
    //return { success: false, message: 'Email mismatch' };
    return 'Email mismatch';
  }
  // Verify password (handle undefined → null)
  let userPassword: string | null;
  if (dbType === 'postgres') {
    const rows = await sql<{ password: string | null }[]>`SELECT password FROM users WHERE id = ${session.user.id}`;
    if (rows.length === 0) //return { success: false, message: 'User not found' };
      return 'User not found';
    userPassword = rows[0].password ?? null;
  } else {
    await connectDB();
    const account = await dataModels.Account.findOne({ userId: strToObjectId(session.user.id) as Types.ObjectId, provider: 'credentials' }).lean();
    if (!account) //return { success: false, message: 'User not found' };
      return 'User not found';
    userPassword = account.password ?? null;
  }
  if (!userPassword) //return { success: false, message: 'User password not set' };
    return 'User password not set';
  const isValid = await bcrypt.compare(password, userPassword);
  if (!isValid) //return { success: false, message: 'Invalid password' };
    return 'Invalid password';
  // Get user details for Stripe customer ID
  const userDetails = await getUserDetails(session.user.id);
  const customerId = userDetails?.customerId;
  await createAnalytics();
  if (dbType === 'postgres') {
    // Delete Stripe customer if exists
    if (customerId) {
      const stripe = initStripe();
      await stripe.customers.del(customerId).catch(err => console.error('Stripe customer deletion failed:', err));
    }
    // Base project tables
    await sql`DELETE FROM posts WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM comments WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM comment_reactions WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM post_reactions WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM customers WHERE user_id = ${session.user.id}`; // cascades to invoices if foreign key set
    // Explicit deletions (redundant if CASCADE, but safe)
    await sql`DELETE FROM user_flight_bookmarks WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM user_hotel_bookmarks WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM flight_reviews WHERE reviewer_id = ${session.user.id}`;
    await sql`DELETE FROM hotel_reviews WHERE reviewer_id = ${session.user.id}`;
    await sql`DELETE FROM flight_bookings WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM hotel_bookings WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM verification_tokens WHERE identifier = ${session.user.id}`;
    await sql`DELETE FROM sessions WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM accounts WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM posts WHERE user_id = ${session.user.id}`;
    await sql`DELETE FROM users WHERE id = ${session.user.id}`;
  } else {
    // MongoDB – start session and delete Stripe customer first
    if (customerId) {
      const stripe = initStripe();
      await stripe.customers.del(customerId).catch(err => console.error('Stripe customer deletion failed:', err));
    }
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();
    try {
      const userId = strToObjectId(session.user.id);
      // Delete related data
      await deleteManyDocs('FlightBooking', { userId }, { session: mongoSession });
      await deleteManyDocs('HotelBooking', { userId }, { session: mongoSession });
      await deleteManyDocs('FlightReview', { reviewer: userId }, { session: mongoSession });
      await deleteManyDocs('HotelReview', { reviewer: userId }, { session: mongoSession });
      await deleteManyDocs('Passenger', { userId }, { session: mongoSession });
      await deleteManyDocs('SearchHistory', { userId }, { session: mongoSession });
      await deleteManyDocs('Verification_Token', { identifier: session.user.id }, { session: mongoSession });
      await deleteManyDocs('PasswordResetToken', { userId }, { session: mongoSession });
      await deleteManyDocs('Session', { userId }, { session: mongoSession });
      await deleteOneDoc('Account', { userId }, { session: mongoSession });
      // Delete all user‑owned data
      //await dataModels.Post.deleteMany({ user_id: session.user.id });
      await deleteManyDocs('Post', { user_id: userId }, { session: mongoSession });
      await deleteManyDocs('Comment', { user_id: userId }, { session: mongoSession });
      await deleteManyDocs('CommentReaction', { user_id: userId }, { session: mongoSession });
      await deleteManyDocs('PostReaction', { user_id: userId }, { session: mongoSession });
      await deleteManyDocs('Customer', { user_id: userId }, { session: mongoSession });
      await deleteOneDoc('User', { _id: userId }, { session: mongoSession });

      await mongoSession.commitTransaction();
    } catch (error) {
      await mongoSession.abortTransaction();
      throw error;
    } finally {
      await mongoSession.endSession();
    }
  }
  await incOrDecrementAnalytics({ totalAccountsDeleted: 1 });
  (await cookies()).delete('authjs.session_token');
  //redirect('/signup?deleted=true');
  redirect('/auth/signout');
}
// old function that was deleted in favor of the new one above
// it was in actions.ts but I moved it here to avoid bloating that file and because they are admin‑specific actions
// ---------- Delete Account ----------
// export async function deleteAccount(_prevState: string | undefined, _formData: FormData) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) return 'Unauthorized';
//   if (dbType === 'postgres') {
//     try {
//       await sql`DELETE FROM posts WHERE user_id = ${session.user.id}`;
//       await sql`DELETE FROM users WHERE id = ${session.user.id}`;
//     } catch (error) {
//       console.error(error);
//       return 'Failed to delete account';
//     }
//   } else {
//     try {
//       await connectDB();
//       await dataModels.Post.deleteMany({ user_id: session.user.id });
//       await dataModels.User.deleteOne({ _id: session.user.id });
//     } catch (error) {
//       console.error(error);
//       return 'Failed to delete account';
//     }
//   }
//   redirect('/auth/signout');
// }