'use server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
import { revalidateTag } from 'next/cache';

export default async function setNewPasswordAction(prevState: any, formData: FormData) {
  const schema = z.object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  }).refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

  const parsed = schema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach(issue => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    return { success: false, error: errors };
  }

  const cookieStore = await cookies();
  const verifiedDataStr = cookieStore.get('e_i')?.value;
  if (!verifiedDataStr) {
    return {
      success: false,
      message: 'Email verification expired. Please verify your email again.',
    };
  }

  const verifiedDataObj = JSON.parse(verifiedDataStr);
  const hashedPassword = bcrypt.hashSync(parsed.data.password, 10);

  try {
    if (dbType === 'postgres') {
      await sql`
        UPDATE accounts
        SET password = ${hashedPassword}, updated_at = NOW()
        WHERE user_id = ${verifiedDataObj.id} AND provider = 'credentials'
      `;
    } else {
      await connectDB();
      await updateOneDoc('Account', { userId: verifiedDataObj.id, provider: 'credentials' }, { password: hashedPassword });
    }
    cookieStore.delete('e_i');
    return {
      success: true,
      message: 'Password updated successfully',
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: 'Something went wrong',
    };
  } finally {
    revalidateTag('userAccount', {});
  }
}