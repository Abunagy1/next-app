// import NextAuth from 'next-auth';
// import { authConfig } from './auth.config';

// import NextAuth from 'next-auth';
// import { authConfig } from './auth.config';
// import type { NextRequest } from 'next/server';
// export default NextAuth(authConfig).auth;
 
// export const config = {
//   // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
//   matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
// };

// middleware.ts
// import NextAuth from 'next-auth';
// import { authConfig } from './auth.config';

// export default NextAuth(authConfig).auth;

// export const config = {
//   matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
// };

import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;
  const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
  const isOnAdmin = nextUrl.pathname.startsWith('/dashboard/admin');
  const isOnLogin = nextUrl.pathname.startsWith('/login');
  const isOnRegister = nextUrl.pathname.startsWith('/register');

  // Allow access to register page even if not logged in
  if (isOnRegister) {
    return NextResponse.next();
  }

  // Admin route protection
  if (isOnAdmin) {
    if (isLoggedIn && session?.user?.role === 'admin') {
      return NextResponse.next();
    }
    // Not admin or not logged in, redirect to dashboard or login
    return NextResponse.redirect(new URL(isLoggedIn ? '/dashboard' : '/login', nextUrl));
  }

  // Dashboard protection (non‑admin routes)
  if (isOnDashboard) {
    if (isLoggedIn) return NextResponse.next();
    return NextResponse.redirect(new URL('/login', nextUrl));
  }

  // If logged in and trying to access login, redirect to dashboard
  if (isLoggedIn && isOnLogin) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  // Allow all other routes
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};

// import NextAuth from 'next-auth';
// import { authConfig } from './auth.config';
// export default NextAuth(authConfig).auth;
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { getToken } from 'next-auth/jwt';

// export async function proxy(request: NextRequest) {
//   const token = await getToken({ 
//     req: request,
//     secret: process.env.NEXTAUTH_SECRET 
//   });
  
//   const isLoggedIn = !!token;
//   const isOnDashboard = request.nextUrl.pathname.startsWith('/dashboard');
  
//   if (isOnDashboard && !isLoggedIn) {
//     const loginUrl = new URL('/login', request.url);
//     return NextResponse.redirect(loginUrl);
//   }
  
//   if (isLoggedIn && request.nextUrl.pathname === '/') {
//     const dashboardUrl = new URL('/dashboard', request.url);
//     return NextResponse.redirect(dashboardUrl);
//   }
  
//   return NextResponse.next();
// }

// export const config = {
//   // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
//   matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
// };