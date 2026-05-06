import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import { revalidateTag } from 'next/cache';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    const redirectUrl = new URL('/user/login', req.url);
    redirectUrl.searchParams.set('callbackUrl', '/dashboard/profiles');
    return NextResponse.redirect(redirectUrl, 307);
  }
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.redirect(new URL('/dashboard/profiles', req.url), 307);
  }
  try {
    let user: any;
    let emailsToVerify: Array<{ email: string; primary?: boolean; inVerification?: boolean; emailVerifiedAt?: Date | null }> = [];
    if (dbType === 'postgres') {
      const users = await sql`
        SELECT id, emails FROM users WHERE id = ${session.user.id}
      `;
      if (users.length === 0) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      user = users[0];
      emailsToVerify = (user.emails as any[]).filter((e: any) => e.inVerification === true);
    } else {
      await connectDB();
      user = await dataModels.User.findById(session.user.id).lean();
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      emailsToVerify = user.emails?.filter((e: any) => e.inVerification === true) || [];
    }
    let verifiedEmail: string | null = null;
    for (const emailObj of emailsToVerify) {
      const email = emailObj.email;
      let isValidToken = false;
      if (dbType === 'postgres') {
        // Use verification_codes table
        const tokens = await sql`
          SELECT id FROM verification_codes
          WHERE identifier = ${email} AND token = ${token} AND expires > NOW()
        `;
        isValidToken = tokens.length > 0;
        if (isValidToken) {
          await sql`DELETE FROM verification_codes WHERE identifier = ${email} AND token = ${token}`;
        }
      } else {
        const tokenDoc = await dataModels.Verification_Token.findOne({
          identifier: email,
          token,
          expires: { $gt: new Date() }
        }).lean();
        if (tokenDoc) {
          isValidToken = true;
          await dataModels.Verification_Token.deleteOne({ _id: tokenDoc._id });
        }
      }
      if (isValidToken) {
        verifiedEmail = email;
        if (dbType === 'postgres') {
          // Update the emails JSONB array
          const updatedEmails = (user.emails as any[]).map((e: any) => {
            if (e.email === email) {
              return {
                ...e,
                emailVerifiedAt: new Date().toISOString(),
                inVerification: false,
              };
            }
            return e;
          });
          await sql`
            UPDATE users
            SET emails = ${JSON.stringify(updatedEmails)}::jsonb,
                email_verified_at = CASE WHEN ${emailObj.primary} THEN NOW() ELSE email_verified_at END,
                updated_at = NOW()
            WHERE id = ${session.user.id}
          `;
        } else {
          await dataModels.User.updateOne(
            { _id: session.user.id, 'emails.email': email },
            {
              $set: {
                'emails.$.emailVerifiedAt': new Date(),
                'emails.$.inVerification': false,
                ...(emailObj.primary === true && { emailVerifiedAt: new Date() }),
              },
            }
          );
        }
        revalidateTag('userDetails',{});
        break;
      }
    }
    if (verifiedEmail) {
      return NextResponse.json({
        success: true,
        message: 'Email verified',
        verifiedEmail,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
  } catch (error) {
    console.error('Confirm email error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}