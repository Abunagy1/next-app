import { NextRequest } from 'next/server';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request }: { auth: any; request: NextRequest }) {
      const isLoggedIn = !!auth?.user;
      const { nextUrl } = request;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnRegister = nextUrl.pathname.startsWith('/register');

      if (isOnRegister) return true;

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn && nextUrl.pathname.startsWith('/login')) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [],
};