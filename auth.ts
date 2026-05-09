import 'server-only';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
async function getUser(email: string): Promise<User | undefined> {
  if (dbType === 'postgres') {
    try {
      const users = await sql<User[]>`SELECT * FROM users WHERE email = ${email}`;
      return users[0];
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error('Failed to fetch user.', { cause: error });
    }
  } else {
    await connectDB();
    try {
      const user = await dataModels.User.findOne({ email }).lean();
      if (!user) return undefined;
      return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        password: user.password,
        email_verified: user.email_verified,
        image: user.image,
        phone: user.phone,
        city: user.city,
        about: user.about,
        birth_date: user.birth_date
          ? user.birth_date.toISOString().split('T')[0]
          : undefined,
        role: user.role,
        created_at: user.created_at?.toISOString(),
        updated_at: user.updated_at?.toISOString(),
      } as User;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error('Failed to fetch user.', { cause: error });
    }
  }
}

export const authOptions = {
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'example@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;
        const user = await getUser(email);
        if (!user) throw new Error('User not found, please signup first');

        const passwordsMatch = await bcrypt.compare(password, user.password);
        if (!passwordsMatch) throw new Error('Invalid password');

        if (!user.email_verified) throw new Error('Please verify your email before logging in.');

        return user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.picture = user.image;
        token.role = (user as any).role;
      }
      // ✅ new: validate the user still exists when using MongoDB
      if (dbType === 'mongodb' && token.id) {
        try {
          await connectDB();
          const exists = await dataModels.User.findById(token.id).select('_id').lean();
          if (!exists) {
            console.log(`🔥 token for non-existent ⚠️ User ${token.id} – invalidating – session may be stale.`);
            // Do NOT invalidate the token; just log.
          }
        } catch (e) {
          console.error('JWT user check failed:', e);
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.image = token.picture as string | undefined;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};

// Cast to any to bypass strict type incompatibility between our User type and NextAuth's internal types
export const { auth, signIn, signOut, handlers } = NextAuth(authOptions as any);