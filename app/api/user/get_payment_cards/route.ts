// import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/auth';
// import { dbType, sql, connectDB } from '@/app/lib/db/index';
// import dataModels from '@/app/lib/db/models';
// import Stripe from 'stripe';
// import { getUserDetails } from '@/app/lib/services/user';
// import { updateOneDoc } from '@/app/lib/db/updateOperationDB';
// import { revalidateTag } from 'next/cache';
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2026-02-25.clover',
// });
// export async function GET(req: NextRequest) {
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
//   }
//   try {
//     const user = await getUserDetails(session.user.id);
//     let customerId = user?.customerId;
//     // Create Stripe customer if missing
//     if (!customerId) {
//       const customer = await stripe.customers.create({
//         name: `${user.firstName} ${user.lastName}`,
//         email: user.email,
//       });
//       customerId = customer.id;
//       if (dbType === 'postgres') {
//         await sql`UPDATE users SET customer_id = ${customerId} WHERE id = ${session.user.id}`;
//       } else {
//         await connectDB();
//         await updateOneDoc('User', { _id: session.user.id }, { customerId });
//       }
//       revalidateTag('userDetails', {});
//       // No payment methods yet for a new customer
//       return NextResponse.json({
//         success: true,
//         data: [],
//         message: 'Payment methods fetched successfully',
//       });
//     }
//     // Fetch existing payment methods
//     const paymentMethods = await stripe.paymentMethods.list({
//       customer: customerId,
//       type: 'card',
//     });
//     const formattedCards = paymentMethods.data.map((item) => ({
//       id: item.id,
//       cardType: item.card?.brand,
//       last4Digits: item.card?.last4,
//       validTill: `${String(item.card?.exp_month).padStart(2, '0')}/${String(item.card?.exp_year).slice(-2)}`,
//     }));
//     return NextResponse.json({
//       success: true,
//       data: formattedCards,
//       message: 'Payment methods fetched successfully',
//     });
//   } catch (error) {
//     console.error('Error fetching payment cards:', error);
//     return NextResponse.json(
//       { success: false, message: 'An error occurred, please try again' },
//       { status: 500 }
//     );
//   }
// }
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { sql, dbType, connectDB } from '@/app/lib/db/index';
import dataModels from '@/app/lib/db/models';
import initStripe from '@/app/lib/paymentIntegration/stripe';
import { revalidateTag } from 'next/cache';
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthenticated' }, { status: 401 });
  }
  try {
    let customerId: string | null = null;
    if (dbType === 'postgres') {
      const users = await sql<{ customer_id: string | null; first_name: string; last_name: string; email: string }[]>`
        SELECT customer_id, first_name, last_name, email FROM users WHERE id = ${session.user.id}
      `;
      if (users.length === 0) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      customerId = users[0].customer_id;
      if (!customerId) {
        // Create Stripe customer
        const stripe = initStripe();
        const customer = await stripe.customers.create({
          name: `${users[0].first_name} ${users[0].last_name}`,
          email: users[0].email,
        });
        customerId = customer.id;
        await sql`UPDATE users SET customer_id = ${customerId} WHERE id = ${session.user.id}`;
        revalidateTag('userDetails', {});
      }
    } else {
      await connectDB();
      const user = await dataModels.User.findById(session.user.id)
        .select('customerId firstName lastName email')
        .lean();
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
      }
      customerId = user.customerId ?? null;
      if (!customerId) {
        const stripe = initStripe();
        const customer = await stripe.customers.create({
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
        });
        customerId = customer.id;
        await dataModels.User.updateOne({ _id: session.user.id }, { $set: { customerId } });
        revalidateTag('userDetails', {});
      }
    }
    // Fetch payment methods
    const stripe = initStripe();
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });
    const cards = paymentMethods.data.map(pm => ({
      id: pm.id,
      cardType: pm.card?.brand,
      last4Digits: pm.card?.last4,
      validTill: `${String(pm.card?.exp_month).padStart(2, '0')}/${String(pm.card?.exp_year).slice(-2)}`,
    }));
    return NextResponse.json({ success: true, data: cards });
  } catch (error) {
    console.error('[get_payment_cards] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch payment cards' },
      { status: 500 }
    );
  }
}