import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import initStripe, { createUniqueCustomer } from '@/app/lib/paymentIntegration/stripe';
import { revalidateTag } from 'next/cache';
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  let body: { idempotencyKey?: string } = {};
  try {
    body = await req.json();
  } catch {
    // No body is fine
  }
  const idempotencyKey = body.idempotencyKey || Date.now().toString();
  try {
    let user: any;
    let customerId: string | null = null;

    if (dbType === 'postgres') {
      const users = await sql<{ id: string; first_name: string; last_name: string; email: string; customer_id: string | null }[]>`
        SELECT id, first_name, last_name, email, customer_id FROM users WHERE id = ${session.user.id}
      `;
      if (users.length === 0) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      user = users[0];
      customerId = user.customer_id;
    } else {
      await connectDB();
      user = await dataModels.User.findById(session.user.id).lean();
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      customerId = user.customerId;
    }

    const stripe = initStripe();

    if (!customerId) {
      const customer = await createUniqueCustomer(
        { name: `${user.first_name} ${user.last_name}`, email: user.email },
        undefined, ['email'] // options
      );
      customerId = customer.id;
      if (dbType === 'postgres') {
        await sql`UPDATE users SET customer_id = ${customerId} WHERE id = ${session.user.id}`;
      } else {
        await dataModels.User.updateOne({ _id: session.user.id }, { $set: { customerId } });
      }
      revalidateTag('userDetails', {});
    }

    const setupIntent = await stripe.setupIntents.create(
      {
        payment_method_types: ['card'],
        customer: customerId,
        usage: 'on_session',
      },
      { idempotencyKey }
    );

    return NextResponse.json({
      success: true,
      message: 'Success',
      data: {
        clientSecret: setupIntent.client_secret,
        customerId,
        idempotencyKey,
      },
    });
  } catch (error: any) {
    console.error('Setup intent error:', error);
    return NextResponse.json({ success: false, message: 'Server Error' }, { status: 500 });
  }
}