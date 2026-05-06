'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { dbType, sql, connectDB, mongoose } from '@/app/lib/db/index';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { deleteOneDoc, deleteManyDocs } from '@/app/lib/db/deleteOperationDB';
import { revalidatePath } from 'next/cache';
import dataModels from '@/app/lib/db/models';
import { z } from 'zod';
import { strToObjectId } from '@/app/lib/db/utilsDB';
// Update user role (admin only)
export async function updateUserRole(prevState: string | undefined, formData: FormData): Promise<string | undefined> {
  import('server-only');
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    //return { success: false, message: 'Forbidden: Admin only' };
    return 'Forbidden: Admin only';
  }
  const userId = formData.get('userId') as string;
  const role = formData.get('role') as string;
  if (!userId || !role) //return { success: false, message: 'Missing data' };
  return 'Missing data';
  try {
    if (dbType === 'postgres') {
      await sql`UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${userId}`;
    } else {
      await connectDB();
      //await updateOneDoc('User', { _id: strToObjectId(userId) }, { role });
      await dataModels.User.updateOne({ _id: userId }, { $set: { role } });
    }
    revalidatePath('/dashboard/admin');
    return undefined;
    //return { success: true, message: 'Role updated' };
  } catch (error) {
    console.error(error);
    //return { success: false, message: 'Failed to update role' };
    return 'Failed to update role';
  }
}
// Delete user (admin only)
export async function deleteUser(prevState: string | undefined, formData: FormData): Promise<string | undefined> {
  import('server-only');
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    //return { success: false, message: 'Forbidden: Admin only' };
    return 'Forbidden: Admin only';
  }
  const userId = formData.get('userId') as string;
  if (!userId) //return { success: false, message: 'Missing user id' };
  return 'Missing user id';
  if (userId === session.user.id) //return 'You cannot delete yourself';
  return 'You cannot delete yourself';
  try {
    if (dbType === 'postgres') {
      // Delete related data (CASCADE should handle, but explicit for safety)
      await sql`DELETE FROM user_flight_bookmarks WHERE user_id = ${userId}`;
      await sql`DELETE FROM user_hotel_bookmarks WHERE user_id = ${userId}`;
      await sql`DELETE FROM flight_reviews WHERE reviewer_id = ${userId}`;
      await sql`DELETE FROM hotel_reviews WHERE reviewer_id = ${userId}`;
      await sql`DELETE FROM flight_bookings WHERE user_id = ${userId}`;
      await sql`DELETE FROM hotel_bookings WHERE user_id = ${userId}`;
      await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
      await sql`DELETE FROM accounts WHERE user_id = ${userId}`;
      // Delete all user‑owned data from base tables
      await sql`DELETE FROM posts WHERE user_id = ${session.user.id}`;
      await sql`DELETE FROM comments WHERE user_id = ${session.user.id}`;
      await sql`DELETE FROM comment_reactions WHERE user_id = ${session.user.id}`;
      await sql`DELETE FROM post_reactions WHERE user_id = ${session.user.id}`;
      await sql`DELETE FROM customers WHERE user_id = ${session.user.id}`; // cascades to invoices if foreign key set
      await sql`DELETE FROM password_reset_tokens WHERE user_id = ${userId}`;
      await sql`DELETE FROM verification_tokens WHERE identifier = ${userId}`;
      await sql`DELETE FROM users WHERE id = ${userId}`;
    } else {
      await connectDB();
      const userIdObj = strToObjectId(userId); if (!userIdObj) return 'Invalid user ID';
      await deleteManyDocs('FlightBooking', { userId: userIdObj });
      await deleteManyDocs('HotelBooking', { userId: userIdObj });
      await deleteManyDocs('FlightReview', { reviewer: userIdObj });
      await deleteManyDocs('HotelReview', { reviewer: userIdObj });
      await deleteManyDocs('Passenger', { userId: userIdObj });
      await deleteManyDocs('SearchHistory', { userId: userIdObj });
      await deleteManyDocs('Verification_Token', { identifier: userId }); // unified Verification_Token collection
      await deleteManyDocs('PasswordResetToken', { userId: userIdObj });
      await deleteManyDocs('Session', { userId: userIdObj });
      await deleteManyDocs('Account', { userId: userIdObj });
      // Invoices are embedded in customers, so no separate deletion needed
      await deleteManyDocs('Post', { userId: userIdObj },);
      await deleteManyDocs('Comment', { userId: userIdObj }, );
      await deleteManyDocs('PostReaction', { userId: userIdObj }, );
      await deleteManyDocs('CommentReaction', { userId: userIdObj }, );
      await deleteManyDocs('Customer', { userId: userIdObj }, );
      await deleteManyDocs('PasswordResetToken', { userId: userIdObj }, );
      await deleteManyDocs('Verification_Token', { userId: userIdObj }, );
      await deleteManyDocs('User', { _id: userIdObj });
    }
    revalidatePath('/dashboard/admin');
    return undefined; // success
    //return { success: true, message: 'User deleted' };
  } catch (error) {
    console.error(error);
    //return { success: false, message: 'Failed to delete user' };
    return 'Failed to delete user';
  }
}
// old functions that was deleted in favor of the new ones above
// they were in actions.ts but I moved them here to avoid bloating that file and because they are admin‑specific actions
// ---------- Update User Role (Admin) ----------
// export async function updateUserRole(prevState: string | undefined, formData: FormData) {
//   import('server-only');
//   const session = await getServerSession(authOptions);
//   if (session?.user?.role !== 'admin') return 'Forbidden';
//   const userId = formData.get('userId') as string;
//   const role = formData.get('role') as string;
//   if (!userId || !role) return 'Missing data';
//   if (dbType === 'postgres') {
//     try {
//       await sql`UPDATE users SET role = ${role} WHERE id = ${userId}`;
//     } catch (error) {
//       console.error(error);
//       return 'Failed to update role';
//     }
//   } else {
//     try {
//       await connectDB();
//       await dataModels.User.updateOne({ _id: userId }, { $set: { role } });
//     } catch (error) {
//       console.error(error);
//       return 'Failed to update role';
//     }
//   }
//   revalidatePath('/dashboard/admin');
//   return undefined;
// }
// ---------- Delete User (Admin) ----------
// export async function deleteUser(prevState: string | undefined, formData: FormData) {
//   import('server-only');
//   const session = await getServerSession(authOptions);
//   if (session?.user?.role !== 'admin') return 'Forbidden';
//   const userId = formData.get('userId') as string;
//   if (!userId) return 'Missing user id';
//   if (userId === session.user.id) return 'You cannot delete yourself';
//   if (dbType === 'postgres') {
//     try {
//       await sql`DELETE FROM users WHERE id = ${userId}`;
//     } catch (error) {
//       console.error(error);
//       return 'Failed to delete user';
//     }
//   } else {
//     try {
//       await connectDB();
//       const userIdObj = new mongoose.Types.ObjectId(userId);
//       // Delete all user‑owned data
//       await dataModels.Post.deleteMany({ user_id: userIdObj });
//       await dataModels.Comment.deleteMany({ user_id: userIdObj });
//       await dataModels.PostReaction.deleteMany({ user_id: userIdObj });
//       await dataModels.CommentReaction.deleteMany({ user_id: userIdObj });
//       await dataModels.User.deleteOne({ _id: userIdObj });
//     } catch (error) {
//       console.error(error);
//       return 'Failed to delete user';
//     }
//   }
//   revalidatePath('/dashboard/admin');
//   return undefined;
// }