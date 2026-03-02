// because auth.ts is imported (directly or indirectly) in a client component.
// Add import 'server-only' to server‑only files to prevent accidental client imports.
import 'server-only';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcrypt';
import postgres from 'postgres';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return user[0];
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
// Create NextAuth instance
export const { auth, signIn, signOut, handlers } = NextAuth({
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
          console.log('🔍 Login attempt for email:', email);
          const user = await getUser(email);
          if (!user) {
            console.log('❌ User not found in database');
            return null;
          }
          console.log('✅ User found. Stored password hash length:', user.password.length);
          const passwordsMatch = await bcrypt.compare(password, user.password);
          console.log('🔑 Passwords match:', passwordsMatch);
          if (passwordsMatch) {
            console.log('✅ Login successful');
            return user;
          } else {
            console.log('❌ Password does not match');
          }
        } else {
          console.log('❌ Credentials parsing failed', parsedCredentials.error);
        }
        return null;
      },
    }),
  ],
  callbacks: {
    // In auth.ts, modify the jwt and session callbacks:
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.picture = user.image; // add image to token
        token.role = (user as any).role;  // include role, // Now TypeScript knows user.role exists
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.image = token.picture as string | undefined; // pass image to session, Now session.user.image is available in your actions and components.
        session.user.role = token.role as string; // add role to session also recognized
      }
      return session;
    },
  },
});
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
// // Create NextAuth instance
// export const { auth, signIn, signOut, handlers } = NextAuth({
//   ...authConfig,
//   providers: [
//     Credentials({
//       async authorize(credentials) {
//         const parsedCredentials = z
//           .object({ email: z.string().email(), password: z.string().min(6) })
//           .safeParse(credentials);
//         if (parsedCredentials.success) {
//           const { email, password } = parsedCredentials.data;
//           const user = await getUser(email);
//           if (!user) return null;
//           const passwordsMatch = await bcrypt.compare(password, user.password);
//           if (passwordsMatch) return user;
//         }
//         console.log('Invalid credentials');
//         return null;
//       },
//     }),
//   ],
// });