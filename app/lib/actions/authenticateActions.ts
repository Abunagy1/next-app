'use server';
import { z } from 'zod';
import { signIn } from '@/auth';
//import  AuthError  from 'next-auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
export async function authenticateAction(prevState: any, formData: FormData) {
  const data = Object.fromEntries(formData);
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });
  const parsed = loginSchema.safeParse({ email: data.email, password: data.password });
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach(issue => {
      const path = issue.path[0];
      const key = typeof path === 'string' ? path : String(path);
      errors[key] = issue.message;
    });
    return { success: false, error: errors };
  }
  try {
    await signIn('credentials', { ...parsed.data, redirect: false });
    const referer = (await headers()).get('referer') || '/';
    const url = new URL(referer);
    const callbackPath = url.searchParams.get('callbackPath');
    redirect(callbackPath || '/');
  } catch (error) {
    // if (error instanceof AuthError) {
    //   return { success: false, message: 'Email or password is incorrect' };
    // }
    if (error instanceof Error && error.name === 'AuthError') {
      return { success: false, message: 'Email or password is incorrect' };
    }
    return { success: false, message: 'Something went wrong' };
  }
}
// app/lib/actions/authenticateActions.ts (add these functions)

export async function authenticateWithGoogle() {
  const requestUrl = await signIn('google', { redirect: false });
  const url = new URL(requestUrl);
  const callbackPath = url.searchParams.get('callbackPath');
  redirect(callbackPath || '/');
}

export async function authenticateWithFacebook() {
  const requestUrl = await signIn('facebook', { redirect: false });
  const url = new URL(requestUrl);
  const callbackPath = url.searchParams.get('callbackPath');
  redirect(callbackPath || '/');
}

export async function authenticateWithApple() {
  // Redirect to your Apple sign‑in route or show a message
  // For now, we redirect to a "coming soon" page
  redirect('/coming-soon');
}