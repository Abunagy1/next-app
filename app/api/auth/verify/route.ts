import { NextResponse } from 'next/server';
// import { sql } from '@vercel/postgres';
// if you want to use postgress
import postgres from 'postgres';
const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  if (!token) {
    return new Response('Missing token', { status: 400 });
  }
  try {
    // Find token
    const result = await sql`
      SELECT user_id, expires FROM verification_tokens
      WHERE token = ${token}
    `;
    // fior postgres, the result is an object with a rows property that contains the array of results.
    if (result.length === 0) {
      return new Response('Invalid or expired token', { status: 400 });
    }
    const { user_id, expires } = result[0];
    if (new Date() > new Date(expires)) {
      return new Response('Token expired', { status: 400 });
    }
    // if you want to use vercel postgres, the result is an object with a rows property that contains the array of results.
    // if (result.rows.length === 0) {
    //   return new Response('Invalid or expired token', { status: 400 });
    // }
    // const { user_id, expires } = result.rows[0];
    // if (new Date() > new Date(expires)) {
    //   return new Response('Token expired', { status: 400 });
    // }
    // Mark user as verified
    await sql`
      UPDATE users SET email_verified = TRUE
      WHERE id = ${user_id}
    `;
    // Delete the used token
    await sql`DELETE FROM verification_tokens WHERE token = ${token}`;
    // Redirect to a success page or login
    return NextResponse.redirect(new URL('/login?verified=1', request.url));
  } catch (error) {
    console.error(error);
    return new Response('Verification failed', { status: 500 });
  }
}