import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import routes from '@/data/routes.json';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get('p_reset_v_token');

  if (!token) {
    return NextResponse.json({ success: false, message: 'No verification token provided' });
  }

  const trimmedToken = token.trim();
  if (!trimmedToken) {
    return NextResponse.json({ success: false, error: { p_reset_v_token: 'Empty field' } });
  }
  if (!/^\d+$/.test(trimmedToken)) {
    return NextResponse.json({ success: false, error: { p_reset_v_token: 'Numbers only' } });
  }

  const cookieStore = await cookies();
  const vdCookie = cookieStore.get('vd')?.value;
  const eiCookie = cookieStore.get('e_i')?.value;

  if (!vdCookie && eiCookie) {
    return NextResponse.json({
      success: false,
      message: `You have already verified email. Go to '${routes['set-new-password'].path}' page to set a password`,
    });
  }
  if (!vdCookie) {
    return NextResponse.json({ success: false, message: 'Code expired, resend new code' });
  }

  let vdObj: { id: string; email: string };
  try {
    vdObj = JSON.parse(vdCookie);
    if (typeof vdObj.id !== 'string' || typeof vdObj.email !== 'string') {
      throw new Error('Invalid cookie structure');
    }
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid session data' });
  }

  const identifier = vdObj.id;
  const numericToken = trimmedToken;
  let isValid = false;

  if (dbType === 'postgres') {
    // Use the new verification_codes table
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM verification_codes
      WHERE identifier = ${identifier}
        AND token = ${numericToken}
        AND expires > NOW()
      LIMIT 1
    `;
    isValid = rows.length > 0;
    if (isValid) {
      await sql`DELETE FROM verification_codes WHERE identifier = ${identifier} AND token = ${numericToken}`;
    }
  } else {
    await connectDB();
    const tokenDoc = await dataModels.Verification_Token.findOne({
      identifier,
      token: numericToken,
      expires: { $gt: new Date() },
    }).lean();
    if (tokenDoc) {
      isValid = true;
      await dataModels.Verification_Token.deleteOne({ _id: tokenDoc._id });
    }
  }

  if (isValid) {
    const secure = process.env.NODE_ENV === 'production';
    cookieStore.set('e_i', vdCookie, {
      maxAge: 60 * 60 * 24,
      httpOnly: true,
      secure,
      sameSite: 'strict',
    });
    cookieStore.delete('vd');
    return NextResponse.json({ success: true, message: 'Verified, Redirecting...' });
  } else {
    return NextResponse.json({ success: false, error: { p_reset_v_token: 'Invalid verification code' } });
  }
}