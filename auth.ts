// // because auth.ts is imported (directly or indirectly) in a client component.
// // Add import 'server-only' to server‑only files to prevent accidental client imports.
// import 'server-only';
// import NextAuth from 'next-auth';
// import Credentials from 'next-auth/providers/credentials';
// import { authConfig } from './auth.config';
// import { z } from 'zod';
// import type { User } from '@/app/lib/definitions';
// import bcrypt from 'bcryptjs';
// import postgres from 'postgres';

// // Check required environment variables
// if (!process.env.POSTGRES_URL) {
//   throw new Error('POSTGRES_URL is not defined in environment');
// }
// if (!process.env.AUTH_SECRET) {
//   throw new Error('AUTH_SECRET is not defined in environment');
// }

// const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

// async function getUser(email: string): Promise<User | undefined> {
//   try {
//     const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
//     return user[0];
//   } catch (error) {
//     console.error('Failed to fetch user:', error);
//     throw new Error('Failed to fetch user.');
//   }
// }

// // Initialize NextAuth with error handling
// let authResult: { auth: any; signIn: any; signOut: any; handlers: any };
// try {
//   authResult = NextAuth({
//     ...authConfig,
//     secret: process.env.AUTH_SECRET,
//     providers: [
//       Credentials({
//         credentials: {
//           email: { label: 'Email', type: 'email', placeholder: 'example@example.com' },
//           password: { label: 'Password', type: 'password' }
//         },
//         async authorize(credentials) {
//           const parsedCredentials = z
//             .object({ email: z.string().email(), password: z.string().min(6) })
//             .safeParse(credentials);
//           if (parsedCredentials.success) {
//             const { email, password } = parsedCredentials.data;
//             const user = await getUser(email);
//             if (!user) return null;
//             const passwordsMatch = await bcrypt.compare(password, user.password);
//             if (passwordsMatch) return user;
//           }
//           return null;
//         },
//       }),
//     ],
//     callbacks: {
//       async jwt({ token, user }) {
//         if (user) {
//           token.id = user.id;
//           token.picture = user.image;
//           token.role = (user as any).role;
//         }
//         return token;
//       },
//       async session({ session, token }) {
//         if (token && session.user) {
//           session.user.id = token.id as string;
//           session.user.image = token.picture as string | undefined;
//           session.user.role = token.role as string;
//         }
//         return session;
//       },
//     },
//   });
// } catch (error) {
//   console.error('NextAuth initialization failed:', error);
//   throw new Error('Authentication setup failed. Check your configuration.');
// }

// export const { auth, signIn, signOut, handlers } = authResult;

// // Double-check that handlers exists
// if (!handlers) {
//   throw new Error('NextAuth did not return handlers. Check your providers and callbacks.');
// }
// auth.ts
import 'server-only';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';

async function getUser(email: string): Promise<User | undefined> {
  const postgres = await import('postgres');
  const sql = postgres.default(process.env.POSTGRES_URL!, { ssl: 'require' });
  try {
    const users = await sql<User[]>`SELECT * FROM users WHERE email = ${email}`;
    return users[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}

// 👇 Define the options separately for reuse
export const authOptions = {
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'example@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) {
            throw new Error('User not found, please signup first'); // 👈 specific error dangarous to let them now if the email is exist or not
            //return null
          };
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) {
            if (!passwordsMatch) {
              throw new Error('Invalid password'); // 👈 specific error
            }
            // ✅ Add this check
            if (!user.email_verified) {
              throw new Error('Please verify your email before logging in.');
            }
            return user;
          }
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.picture = user.image;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.image = token.picture as string | undefined;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

export const { auth, signIn, signOut, handlers } = NextAuth(authOptions);