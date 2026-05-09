import { NextResponse } from 'next/server';
// import { sql } from '@vercel/postgres';
// if you want to use postgress
//import postgres from 'postgres';
//const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
import { sql, mongoose, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }
  try {
    if (dbType === 'postgres') {
      // Find token - Use unified verification_codes table
      const result = await sql`
        SELECT identifier, expires FROM verification_tokens
        WHERE token = ${token}
      `; // it was user_id before, but we are using identifier now to unify with old project. The identifier can be user_id or email depending on the use case. For email verification, it will be user_id. For password reset, it could be email.
      // fior postgres, the result is an object with a rows property that contains the array of results.
      if (result.length === 0) {
        return new Response('Invalid or expired token', { status: 400 });
      }
      //const { user_id, expires } = result[0];
      const { identifier, expires } = result[0];
      if (new Date() > new Date(expires)) {
        return new Response('Token expired', { status: 400 });
      }
      await sql`
        UPDATE users SET email_verified = TRUE
        WHERE id = ${identifier}
      `;
      // Delete the used token
      await sql`DELETE FROM verification_tokens WHERE token = ${token}`;
      // Redirect to a success page or login
      return NextResponse.redirect(new URL('/user/login?verified=1', request.url));
    } else {
      await connectDB();
      const tokenDoc = await dataModels.Verification_Token.findOne({ token }).lean();
      if (!tokenDoc) {
        return new Response('Invalid or expired token', { status: 400 });
      }
      if (new Date() > new Date(tokenDoc.expires)) {
        return new Response('Token expired', { status: 400 });
      }
      await dataModels.User.updateOne({ _id: tokenDoc.identifier }, { email_verified: true });
      // await dataModels.Verification_Token.deleteOne({ token });
      await dataModels.Verification_Token.deleteOne({ _id: tokenDoc._id });
    }
    return NextResponse.redirect(new URL('/user/login?verified=1', request.url));
  } catch (error) {
    console.error(error);
    return new Response('Verification failed', { status: 500 });
  }
}