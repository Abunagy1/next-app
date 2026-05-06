'use server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import initStripe from '@/app/lib/paymentIntegration/stripe';
import { getUserDetails } from '@/app/lib/services/user';
// this function is exist already in the updateProfileActions, we can move it to a separate file if we want to reuse it in other actions
export default async function deletePaymentCardAction(pMethodId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { success: false, message: 'Unauthorized' };

  try {
    const user = await getUserDetails(session.user.id);
    const customerId = user?.customerId;
    if (!customerId) return { success: false, message: 'No customer found' };

    const stripe = initStripe();
    const paymentMethod = await stripe.paymentMethods.retrieve(pMethodId);
    if (customerId !== paymentMethod.customer) {
      return { success: false, message: 'Payment method does not belong to user' };
    }
    await stripe.paymentMethods.detach(pMethodId);
    return { success: true, message: 'Payment card deleted successfully' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Something went wrong' };
  }
}