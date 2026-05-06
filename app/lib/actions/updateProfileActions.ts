'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { revalidateTag } from 'next/cache';
import sharp from 'sharp';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { getOneDoc } from '@/app/lib/db/getOperationDB';
import { strToObjectId } from '@/app/lib/db/utilsDB';
import initStripe from '@/app/lib/paymentIntegration/stripe';
// ----------------------------------------------------------------------
// Helper: Safely update Stripe customer if customerId exists
// ----------------------------------------------------------------------
async function updateStripeCustomerIfExists(
  userId: string,
  updateData: { name?: string; email?: string }
): Promise<void> {
  // Fetch customerId from DB
  let customerId: string | null = null;
  if (dbType === 'postgres') {
    const rows = await sql<{ customer_id: string | null }[]>`
      SELECT customer_id FROM users WHERE id = ${userId}
    `;
    customerId = rows[0]?.customer_id ?? null;
  } else {
    await connectDB();
    const user = await dataModels.User.findById(userId).select('customerId').lean();
    customerId = user?.customerId ?? null;
  }
  if (!customerId) return; // No Stripe customer linked
  try {
    const stripe = initStripe();
    await stripe.customers.update(customerId, updateData);
  } catch (error) {
    // Log but don't fail the whole operation – Stripe is not critical for profile updates
    console.error('Failed to update Stripe customer:', error);
  }
}
// ----------------------------------------------------------------------
// updateNameAction
// ----------------------------------------------------------------------
export async function updateNameAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const data = Object.fromEntries(formData);
  const schema = z
    .object({
      firstName: z.string().trim().min(1, 'First name is required'),
      lastName: z.string().trim().min(1, 'Last name is required'),
    })
    .safeParse(data);
  if (!schema.success) {
    const errors: Record<string, string> = {};
    schema.error.issues.forEach(issue => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    return { success: false, error: errors };
  }
  const { firstName, lastName } = schema.data;
  try {
    // Update database
    if (dbType === 'postgres') {
      await sql`
        UPDATE users SET first_name = ${firstName}, last_name = ${lastName}, updated_at = NOW()
        WHERE id = ${session.user.id}
      `;
    } else {
      await connectDB();
      await updateOneDoc('User', { _id: strToObjectId(session.user.id) }, { firstName, lastName });
    }
    // Sync with Stripe
    await updateStripeCustomerIfExists(session.user.id, {
      name: `${firstName} ${lastName}`,
    });
    revalidateTag('userDetails', {});
    return { success: true, message: 'Name changed successfully' };
  } catch (err) {
    console.error(err);
    return { success: false, message: 'Failed to update name' };
  }
}
// ----------------------------------------------------------------------
// updateEmailAction
// ----------------------------------------------------------------------
export async function updateEmailAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const data = Object.fromEntries(formData);
  const schema = z.object({
    email: z.string().email('Invalid email').min(1, 'Email is required'),
  }).safeParse(data);
  if (!schema.success) {
    const errors: Record<string, string> = {};
    schema.error.issues.forEach(issue => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    return { success: false, error: errors };
  }
  const newEmail = schema.data.email;
  const prevEmail = formData.get('prevEmail') as string;
  // Check if email already used by another user
  if (dbType === 'postgres') {
    const existing = await sql`SELECT id FROM users WHERE email = ${newEmail} AND id != ${session.user.id}`;
    if (existing.length) {
      return { success: false, error: { email: 'Email already in use' } };
    }
    // Update emails array and main email field
    const userRows = await sql`SELECT emails FROM users WHERE id = ${session.user.id}`;
    if (userRows.length) {
      const emails = userRows[0].emails || [];
      const emailIndex = emails.findIndex((e: any) => e.email === prevEmail);
      if (emailIndex !== -1) {
        emails[emailIndex].email = newEmail;
        emails[emailIndex].emailVerifiedAt = null;
        emails[emailIndex].inVerification = false;
      }
      await sql`
        UPDATE users SET
          email = ${newEmail},
          emails = ${JSON.stringify(emails)}::jsonb,
          email_verified = FALSE,
          email_verified_at = NULL,
          updated_at = NOW()
        WHERE id = ${session.user.id}
      `;
    }
  } else {
    await connectDB();
    const existing = await dataModels.User.findOne({
      email: newEmail,
      _id: { $ne: strToObjectId(session.user.id) }
    }).lean();
    if (existing) return { success: false, error: { email: 'Email already in use' } };
    await updateOneDoc(
      'User',
      { _id: strToObjectId(session.user.id), 'emails.email': prevEmail },
      {
        $set: {
          email: newEmail,
          'emails.$.email': newEmail,
          'emails.$.emailVerifiedAt': null,
          'emails.$.inVerification': false,
          email_verified: false,
          emailVerifiedAt: null,
        },
      }
    );
  }
  // Sync with Stripe
  await updateStripeCustomerIfExists(session.user.id, { email: newEmail });
  revalidateTag('userDetails', {});
  return { success: true, message: 'Email updated successfully. Please verify your new email.' };
}
// ----------------------------------------------------------------------
// addNewEmailAction
// ----------------------------------------------------------------------
export async function addNewEmailAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const data = Object.fromEntries(formData);
  const schema = z.object({
    email: z.string().email('Invalid email').min(1, 'Email is required'),
  }).safeParse(data);
  if (!schema.success) {
    const errors: Record<string, string> = {};
    schema.error.issues.forEach(issue => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    return { success: false, error: errors };
  }
  const newEmail = schema.data.email;
  if (dbType === 'postgres') {
    const userRows = await sql`SELECT emails FROM users WHERE id = ${session.user.id}`;
    if (userRows.length) {
      const emails = userRows[0].emails || [];
      if (emails.some((e: any) => e.email === newEmail)) {
        return { success: false, error: { email: 'Email already exists' } };
      }
      emails.push({ email: newEmail, primary: false, emailVerifiedAt: null, inVerification: false });
      await sql`
        UPDATE users SET emails = ${JSON.stringify(emails)}::jsonb, updated_at = NOW()
        WHERE id = ${session.user.id}
      `;
    }
  } else {
    await connectDB();
    const user = await getOneDoc('User', { _id: strToObjectId(session.user.id) }, [], 0);
    if (user.emails?.some((e: any) => e.email === newEmail)) {
      return { success: false, error: { email: 'Email already exists' } };
    }
    await updateOneDoc('User', { _id: strToObjectId(session.user.id) }, {
      $push: { emails: { email: newEmail, primary: false, emailVerifiedAt: null, inVerification: false } },
    });
  }
  revalidateTag('userDetails', {});
  return { success: true, message: 'New email added successfully' };
}
// ----------------------------------------------------------------------
// updatePhoneAction
// ----------------------------------------------------------------------
export async function updatePhoneAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const data = Object.fromEntries(formData);
  const schema = z.object({
    number: z.string().regex(/^\d+$/, 'Invalid phone number').min(1, 'Phone number is empty'),
    dialCode: z.string().min(1, 'Calling code is required'),
  }).safeParse(data);
  if (!schema.success) {
    const errors: any = {};
    let errorStrs = '';
    schema.error.issues.forEach(issue => { errorStrs += issue.message + '. '; });
    errors.phone = errorStrs;
    return { success: false, error: errors };
  }
  const phoneNumbers = [{ ...schema.data, primary: true }];
  if (dbType === 'postgres') {
    await sql`
      UPDATE users SET
        phone = ${schema.data.dialCode + schema.data.number},
        phone_numbers = ${JSON.stringify(phoneNumbers)}::jsonb,
        updated_at = NOW()
      WHERE id = ${session.user.id}
    `;
  } else {
    await connectDB();
    await updateOneDoc('User', { _id: strToObjectId(session.user.id) }, {
      phone: schema.data.dialCode + schema.data.number,
      phoneNumbers,
    });
  }
  revalidateTag('userDetails', {});
  return { success: true, message: 'Phone number updated successfully' };
}
// ----------------------------------------------------------------------
// updateAddressAction
// ----------------------------------------------------------------------
export async function updateAddressAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const data = Object.fromEntries(formData);
  const schema = z.object({ address: z.string().min(1, 'Address is required') }).safeParse(data);
  if (!schema.success) {
    const errors: Record<string, string> = {};
    schema.error.issues.forEach(issue => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    return { success: false, error: errors };
  }
  const address = schema.data.address.trim();
  if (dbType === 'postgres') {
    await sql`UPDATE users SET address = ${address}, updated_at = NOW() WHERE id = ${session.user.id}`;
  } else {
    await connectDB();
    await updateOneDoc('User', { _id: strToObjectId(session.user.id) }, { address });
  }
  revalidateTag('userDetails', {});
  return { success: true, message: 'Address updated successfully' };
}
// ----------------------------------------------------------------------
// updateDateOfBirthAction
// ----------------------------------------------------------------------
export async function updateDateOfBirthAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const data = Object.fromEntries(formData);
  const schema = z.object({ birth_date: z.string().min(1, 'Date of birth is required') }).safeParse(data);
  if (!schema.success) {
    const errors: Record<string, string> = {};
    schema.error.issues.forEach(issue => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    return { success: false, error: errors };
  }
  const birth_date = new Date(schema.data.birth_date);
  if (isNaN(birth_date.getTime())) {
    return { success: false, error: { birth_date: 'Invalid date of birth' } };
  }
  if (dbType === 'postgres') {
    await sql`
      UPDATE users SET birth_date = ${birth_date}, updated_at = NOW()
      WHERE id = ${session.user.id}
    `;
  } else {
    await connectDB();
    await updateOneDoc('User', { _id: strToObjectId(session.user.id) }, {
      birth_date: birth_date,
    });
  }
  revalidateTag('userDetails', {});
  return { success: true, message: 'Date of birth updated successfully' };
}
// ----------------------------------------------------------------------
// updatePasswordAction
// ----------------------------------------------------------------------
export async function updatePasswordAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const data = Object.fromEntries(formData);
  const schema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  }).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach(issue => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    return { success: false, error: errors };
  }
  const { currentPassword, newPassword } = parsed.data;
  let isValid = false;
  if (dbType === 'postgres') {
    const rows = await sql`SELECT password FROM users WHERE id = ${session.user.id}`;
    if (rows.length && rows[0].password) {
      isValid = await bcrypt.compare(currentPassword, rows[0].password);
    }
  } else {
    await connectDB();
    const account = await dataModels.Account.findOne({ userId: session.user.id, provider: 'credentials' }).lean();
    if (account && account.password) {
      isValid = await bcrypt.compare(currentPassword, account.password);
    }
  }
  if (!isValid) return { success: false, error: { currentPassword: 'Incorrect password' } };
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  if (dbType === 'postgres') {
    await sql`UPDATE users SET password = ${hashedPassword}, updated_at = NOW() WHERE id = ${session.user.id}`;
  } else {
    await updateOneDoc('Account', { userId: session.user.id, provider: 'credentials' }, { password: hashedPassword });
  }
  revalidateTag('userAccount', {});
  return { success: true, message: 'Password changed successfully' };
}
// ----------------------------------------------------------------------
// updateProfilePictureAction
// ----------------------------------------------------------------------
export async function updateProfilePictureAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const imgBase64 = formData.get('profilePic') as string;
  const base64Data = imgBase64.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');
  const editedImageBuffer = await sharp(buffer)
    .resize({ width: 512, height: 512 })
    .jpeg({ quality: 100 })
    .toBuffer();
  const imageData = 'data:image/jpg;base64,' + editedImageBuffer.toString('base64');
  if (dbType === 'postgres') {
    await sql`
      UPDATE users SET image = ${imageData}, updated_at = NOW()
      WHERE id = ${session.user.id}
    `;
  } else {
    await connectDB();
    await updateOneDoc('User', { _id: strToObjectId(session.user.id) }, {
      image: imageData
    });
  }
  revalidateTag('userDetails', {});
  return { success: true, message: 'Profile picture updated successfully' };
}
// ----------------------------------------------------------------------
// updateCoverPhotoAction
// ----------------------------------------------------------------------
export async function updateCoverPhotoAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const imgFile = formData.get('upload-cover-photo-form') as File;
  const buffer = Buffer.from(await imgFile.arrayBuffer());
  const image = await sharp(buffer)
    .resize({ width: 1296, height: 350 })
    .jpeg({ quality: 100 })
    .toBuffer();
  const imageData = 'data:image/jpg;base64,' + image.toString('base64');
  try {
    if (dbType === 'postgres') {
      await sql`
        UPDATE users SET cover_image = ${imageData}, updated_at = NOW()
        WHERE id = ${session.user.id}
      `;
    } else {
      await connectDB();
      await updateOneDoc('User', { _id: strToObjectId(session.user.id) }, { coverImage: imageData });
    }
    revalidateTag('userDetails', {});
    return { success: true, message: 'Cover photo changed successfully' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Something went wrong' };
  }
}
// ----------------------------------------------------------------------
// deletePaymentCardAction
// ----------------------------------------------------------------------
export async function deletePaymentCardAction(paymentMethodId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Please login first' };
  let customerId: string | null = null;
  if (dbType === 'postgres') {
    const rows = await sql<{ customer_id: string | null }[]>`SELECT customer_id FROM users WHERE id = ${session.user.id}`;
    if (rows.length) customerId = rows[0].customer_id ?? null;
  } else {
    await connectDB();
    const user = await dataModels.User.findById(session.user.id).select('customerId').lean();
    if (user) customerId = user.customerId ?? null;
  }
  if (!customerId) return { success: false, message: 'No Stripe customer found' };
  const stripe = initStripe();
  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
  if (paymentMethod.customer !== customerId) {
    return { success: false, message: 'You are not authorized to delete this payment card' };
  }
  await stripe.paymentMethods.detach(paymentMethodId);
  return { success: true, message: 'Payment card deleted successfully' };
}
// ----------------------------------------------------------------------
// Update City And Phone
// ----------------------------------------------------------------------
// updateCityAction
export async function updateCityAction(prevState: any, formData: FormData): Promise<{ success?: boolean; message?: string; error?: { city?: string } }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const city = (formData.get('city') as string)?.trim();
  if (!city) return { success: false, error: { city: 'City is required' } };

  try {
    if (dbType === 'postgres') {
      await sql`UPDATE users SET city = ${city}, updated_at = NOW() WHERE id = ${session.user.id}`;
    } else {
      await connectDB();
      await updateOneDoc('User', { _id: strToObjectId(session.user.id) }, { city });
    }
    revalidateTag('userDetails', {});
    return { success: true, message: 'City updated successfully' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to update city' };
  }
}

// updateAboutAction
export async function updateAboutAction(prevState: any, formData: FormData): Promise<{ success?: boolean; message?: string; error?: { about?: string } }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };
  const about = (formData.get('about') as string)?.trim();

  try {
    if (dbType === 'postgres') {
      await sql`UPDATE users SET about = ${about}, updated_at = NOW() WHERE id = ${session.user.id}`;
    } else {
      await connectDB();
      await updateOneDoc('User', { _id: strToObjectId(session.user.id) }, { about });
    }
    revalidateTag('userDetails', {});
    return { success: true, message: 'About updated successfully' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to update about' };
  }
}

export async function updateUserSettingsAction(prevState: any, formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

  // Build a plain object from the form (all values are strings, so convert booleans)
  const updates: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (value === 'true') updates[key] = true;
    else if (value === 'false') updates[key] = false;
    else updates[key] = value; // string
  }

  try {
    if (dbType === 'postgres') {
      await sql`
        UPDATE users
        SET user_settings = COALESCE(user_settings, '{}'::jsonb) || ${JSON.stringify(updates)}::jsonb,
            updated_at = NOW()
        WHERE id = ${session.user.id}
      `;
    } else {
      await connectDB();
      // Convert updates to MongoDB dot-notation for nested fields
      const setFields: Record<string, any> = {};
      for (const [key, val] of Object.entries(updates)) {
        setFields[`userSettings.${key}`] = val;
      }
      await updateOneDoc('User', { _id: strToObjectId(session.user.id) }, { $set: setFields });
    }
    revalidateTag('userDetails', {});
    return { success: true, message: 'Settings updated' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to update settings' };
  }
}