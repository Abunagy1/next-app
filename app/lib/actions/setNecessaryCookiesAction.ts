// app/lib/actions/setNecessaryCookiesAction.ts
import { cookies } from 'next/headers';

type CookieValue = string | number | boolean;
type CookieOptions = {
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  maxAge?: number;
};

type CookieInput = {
  value: CookieValue;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  maxAge?: number;
};

type CookiesObj = Record<string, CookieInput>;

/**
 * Sets necessary cookies (e.g., timezone, session preferences) on the server.
 * @param cookiesObj - Object mapping cookie names to their options and value.
 * @returns Promise resolving to success status.
 */
export default async function setNecessaryCookiesAction(
  cookiesObj: CookiesObj
): Promise<{ success: boolean; message: string }> {
  const cookieStore = await cookies();

  for (const [name, cookie] of Object.entries(cookiesObj)) {
    const value = String(cookie.value);
    const options = {
      path: cookie.path || '/',
      secure: cookie.secure ?? process.env.NODE_ENV === 'production',
      httpOnly: cookie.httpOnly ?? true,
      sameSite: cookie.sameSite || 'strict',
      maxAge: cookie.maxAge ?? 60 * 60 * 24 * 365, // 1 year default
    };
    cookieStore.set(name, value, options);
  }

  return { success: true, message: 'Cookies set successfully' };
}