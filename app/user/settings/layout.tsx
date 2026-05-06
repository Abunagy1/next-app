import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';
import { SettingsSideBar } from '@/components/pages/settings/sections/SideBar';
import routes from '@/data/routes.json';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(
      `${routes.login.path}?callbackPath=${encodeURIComponent(routes.settings.path)}`
    );
  }

  return (
    <main className="mx-auto mt-10 mb-[80px] w-[95%] sm:w-[90%]">
      <div className="mb-4">
        <h1 className="text-3xl mb-2 font-bold">Settings</h1>
        <p className="text-sm opacity-60">Manage your account in settings.</p>
      </div>
      <div className="flex flex-col md:flex-row bg-white rounded-md">
        <SettingsSideBar />
        <div className="p-4 flex-1 dark:bg-gray-800 dark:border-gray-700">{children}</div>
      </div>
    </main>
  );
}