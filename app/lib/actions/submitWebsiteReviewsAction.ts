'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { dbType, sql, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { createOneDoc } from '@/app/lib/db/createOperationDB';
import { isObject, isValidJSON } from '@/app/lib/utils';
export default async function submitWebsiteReviewsAction(formData: FormData | Record<string, any> | string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false, message: 'Unauthenticated' };
  }
  // Extract data – supports FormData or plain object
  let data: Record<string, any>;
  if (formData instanceof FormData) {
    data = Object.fromEntries(formData);
  } else if (typeof formData === 'string' && isValidJSON(formData)) {
    data = JSON.parse(formData);
  } else if (isObject(formData)) {
    data = formData;
  } else {
    data = {  }; // data = { ...formData };
  }
  // Validate with Zod
  const validatedData = z
    .object({
      rating: z
        .number()
        .min(1, 'Rating must be between 1 and 5')
        .max(5, 'Rating must be between 1 and 5'),
      category: z
        .string()
        .min(1, 'Category is required')
        .transform((val, ctx) => {
          const allowed = ['customer_support', 'pricing', 'reliability', 'communication', 'overall'];
          if (!allowed.includes(val)) {
            ctx.addIssue({ code: 'custom', message: 'Invalid category' });
            return z.NEVER;
          }
          return val;
        }),
      comment: z
        .string()
        .min(1, 'Comment is required')
        .max(500, 'Comment is too long'),
    })
    .safeParse(data);
  if (!validatedData.success) {
    const errors: Record<string, string> = {};
    validatedData.error.issues.forEach((issue) => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    return { success: false, message: 'Error in form data', error: errors };
  }
  const { rating, category, comment } = validatedData.data;
  try {
    if (dbType === 'postgres') {
      await sql`
        INSERT INTO website_reviews (user_id, rating, category, comment, created_at, updated_at)
        VALUES (${session.user.id}, ${rating}, ${category}, ${comment}, NOW(), NOW())
      `;
    } else {
      await connectDB();
      await createOneDoc('WebsiteReview', {
        userId: session.user.id,
        rating,
        category,
        comment,
      });
    }
    return { success: true, message: 'Review submitted successfully' };
  } catch (error) {
    console.error('Error creating website review:', error);
    return { success: false, message: 'Error in creating review' };
  } finally {
    revalidateTag('websiteReviews',{});
    revalidateTag('websiteReviewsStats',{});
    revalidateTag(`${session.user.id}_hasAlreadyReviewed`,{});
  }
}