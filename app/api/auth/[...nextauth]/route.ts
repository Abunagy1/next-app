// import NextAuth from "next-auth";
// import Credentials from "next-auth/providers/credentials";
// export const { GET, POST } = NextAuth({
//   providers: [
//     Credentials({
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" }
//       },
//       async authorize(credentials) {
//         // Accept any non-empty credentials for testing
//         if (credentials?.email && credentials?.password) {
//           return { id: "1", name: "Test User", email: credentials.email as string };
//         }
//         return null;
//       },
//     }),
//   ],
// });
import NextAuth from "next-auth";
import { authOptions } from "@/auth";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };