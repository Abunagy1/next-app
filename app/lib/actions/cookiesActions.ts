'use server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { isObject, isValidJSON } from '@/app/lib/utils';

export async function getCookiesAction(cookieNameArr: string[] = []) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  if (cookieNameArr.length === 0) return allCookies;
  return allCookies.filter(cookie => cookieNameArr.includes(cookie.name));
}

export async function deleteCookiesAction(cookiesArr: string[]) {
  const cookieStore = await cookies();
  for (const name of cookiesArr) {
    cookieStore.delete(name);
  }
}

export async function setCookiesAction(cookiesArr: any) {
  const oneMonth = 60 * 60 * 24 * 30;
  let normalized: any[];
  if (typeof cookiesArr === 'string') {
    if (!isValidJSON(cookiesArr)) throw new TypeError('Invalid JSON string');
    const parsed = JSON.parse(cookiesArr);
    normalized = Array.isArray(parsed) ? parsed : [parsed];
  } else if (Array.isArray(cookiesArr)) {
    normalized = cookiesArr;
  } else if (isObject(cookiesArr)) {
    normalized = [cookiesArr];
  } else {
    throw new TypeError('Input must be array, object, or JSON string');
  }

  const cookieValidation = z.array(
    z.object({
      name: z.string().min(1),
      value: z.union([z.string(), z.number(), z.boolean()]).transform(String),
      domain: z.string().optional(),
      path: z.string().optional(),
      expires: z.date().optional(),
      secure: z.boolean().optional(),
      sameSite: z.enum(['lax', 'strict', 'none']).optional(),
      httpOnly: z.boolean().optional(),
      maxAge: z.number().optional(),
      partitioned: z.boolean().optional(),
    })
  );
  const { success, data, error } = cookieValidation.safeParse(normalized);
  if (!success) throw error;

  const cookieStore = await cookies();
  for (const cookie of data) {
    cookieStore.set({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path ?? '/',
      expires: cookie.expires,
      secure: cookie.secure ?? process.env.NODE_ENV === 'production',
      sameSite: cookie.sameSite ?? 'strict',
      httpOnly: cookie.httpOnly ?? true,
      maxAge: cookie.maxAge,
      partitioned: cookie.partitioned,
    });
  }
  return { success: true, message: 'Cookies set' };
}