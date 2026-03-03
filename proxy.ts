import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isLoggedIn = !!token;
  const role = token?.role as string | undefined;

  const { pathname } = req.nextUrl;
  const isOnDashboard = pathname.startsWith('/dashboard');
  const isOnAdmin = pathname.startsWith('/dashboard/admin');
  const isOnLogin = pathname.startsWith('/login');
  const isOnRegister = pathname.startsWith('/register');

  // Allow access to register page even if not logged in
  if (isOnRegister) {
    return NextResponse.next();
  }

  // Admin route protection
  if (isOnAdmin) {
    if (isLoggedIn && role === 'admin') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL(isLoggedIn ? '/dashboard' : '/login', req.url));
  }

  // Dashboard protection (non‑admin routes)
  if (isOnDashboard) {
    if (isLoggedIn) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // If logged in and trying to access login, redirect to dashboard
  if (isLoggedIn && isOnLogin) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Allow all other routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};