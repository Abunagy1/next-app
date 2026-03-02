import { DefaultSession, DefaultUser } from "next-auth";
declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string; // optional because not all users may have it (or you can make it required)
  }
  interface Session {
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}