import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import AccountSettings from '@/components/pages/settings/sections/AccountSettings';
import AppearanceSettings from '@/components/pages/settings/sections/AppearanceSettings';
import PaymentSettings from '@/components/pages/settings/sections/PaymentSettings';
import ProfileSettings from '@/components/pages/settings/sections/ProfileSettings';
import SecuritySettings from '@/components/pages/settings/sections/SecuritySettings';
import { getUserDetails } from '@/app/lib/services/user';
import routes from '@/data/routes.json';

// app/user/settings/page.tsx
export default async function SettingsPage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  const session = await getServerSession(authOptions);
  const userDetails = await getUserDetails(session?.user?.id);
  if (!userDetails) redirect(routes.login.path);

  const tab = (await searchParams)?.tab;
  const userSettings = userDetails?.userSettings || {};

  const renderContent = () => {
    switch (tab) {
      case 'account':
        return <AccountSettings userDetails={userDetails as any} />;
      case 'payments':
        return <PaymentSettings />;
      case 'security':
        return <SecuritySettings initialSettings={userSettings} />;
      case 'appearance':
        return <AppearanceSettings initialSettings={userSettings} />;
      default:
        return <ProfileSettings userDetails={userDetails as any} />;
    }
  };

  return <div>{renderContent()}</div>;
}