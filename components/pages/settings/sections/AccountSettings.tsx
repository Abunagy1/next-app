import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DeleteAccountPopupForm from '../ui/DeleteAccountPopupForm';
import { isDateObjValid } from '@/app/lib/utils';
import { VerifyEmailBtn } from '../../profile/ui/VerifyEmailBtn';
import { cookies } from 'next/headers';

interface UserEmail {
  email: string;
  primary: boolean;
  emailVerifiedAt: string | null;
}

interface UserDetails {
  emails: UserEmail[];
}

interface AccountSettingsProps {
  userDetails: UserDetails;
}

export default async function AccountSettings({ userDetails }: AccountSettingsProps) {
  let emails = userDetails.emails;
  if (typeof emails === 'string') {
    try { emails = JSON.parse(emails); } catch { emails = []; }
  }
  if (!Array.isArray(emails)) emails = [];
  // -----------------------------------

  const primaryEmail = emails.find((email) => email.primary);
  const cookieStore = await cookies();
  const sendAgainAt = cookieStore.get('sai')?.value;

  const subscription = {
    plan: 'Basic',
    renewalDate: '2025-07-01',
  };

  // const primaryEmail = userDetails.emails.find((email) => email.primary);

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {/* Login Email */}
      <Card className="dark:bg-gray-800 gray:border-gray-300">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Login Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-x-2">
            <span className="font-medium dark:text-white">{primaryEmail?.email}</span>
            {primaryEmail && (
              <VerifyEmailBtn email={primaryEmail.email} sendAgainAt={sendAgainAt} />
            )}
          </div>
          <p className={`text-sm  ${isDateObjValid(primaryEmail?.emailVerifiedAt) ? 'text-green-600' : 'text-red-600'}`}>
            {isDateObjValid(primaryEmail?.emailVerifiedAt) ? 'Verified' : 'Not Verified'}
          </p>
        </CardContent>
      </Card>

      {/* Subscription Plan */}
      <Card className="opacity-30 dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Subscription Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 ">
          <p className="dark:text-gray-300">Current Plan: <strong>{subscription.plan}</strong></p>
          <p className="dark:text-gray-300">Next Renewal Date: {subscription.renewalDate}</p>
          <Button disabled className="dark:bg-gray-700 dark:text-gray-400">Change / Upgrade Plan</Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <DeleteAccountPopupForm />
    </div>
  );
}