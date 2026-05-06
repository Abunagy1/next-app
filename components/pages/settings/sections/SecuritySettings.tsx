"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { updateUserSettingsAction } from '@/app/lib/actions/updateProfileActions';
import { toast } from 'sonner';
import { useActionState, useEffect } from 'react';

export default function SecuritySettings({ initialSettings }: { initialSettings?: any }) {
  const [state, formAction] = useActionState(updateUserSettingsAction, null);

  const handleToggle = (key: string, value: boolean) => {
    const fd = new FormData();
    fd.append(key, String(value));
    formAction(fd);
  };

  useEffect(() => {
    if (state?.success) toast.success(state.message);
  }, [state]);

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      {/* Change Password (keep as is, but not managed by settings) */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader><CardTitle className="text-xl font-semibold dark:text-white">Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input type="password" placeholder="New Password" className="dark:bg-gray-700 dark:text-white dark:border-gray-600" />
          <Button>Update Password</Button>
        </CardContent>
      </Card>

      {/* Two‑Factor Authentication */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader><CardTitle className="text-xl font-semibold dark:text-white">Two‑Factor Authentication (2FA)</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-muted-foreground dark:text-gray-400">Enable extra security during login</span>
          <Switch
            checked={initialSettings?.twoFactor || false}
            onCheckedChange={(val) => handleToggle('twoFactor', val)}
          />
        </CardContent>
      </Card>

      {/* Login Alerts */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader><CardTitle className="text-xl font-semibold dark:text-white">Login Alerts</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-muted-foreground dark:text-gray-400">Receive alerts for unrecognized logins</span>
          <Switch
            checked={initialSettings?.loginAlerts ?? true}
            onCheckedChange={(val) => handleToggle('loginAlerts', val)}
          />
        </CardContent>
      </Card>

      {/* Active Sessions (not yet implemented) */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader><CardTitle className="text-xl font-semibold dark:text-white">Active Sessions</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm dark:text-white">Chrome · Dhaka · Active now</p>
          <p className="text-sm dark:text-white">Firefox · New York · Last active 2h ago</p>
          <Button variant="outline" className="dark:text-white" disabled>Sign out from all sessions</Button>
        </CardContent>
      </Card>

      {/* Trusted Devices (not yet implemented) */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader><CardTitle className="text-xl font-semibold dark:text-white">Trusted Devices</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm dark:text-white">MacBook Pro · Added Jan 12, 2025</p>
          <p className="text-sm dark:text-white">iPhone 14 · Added May 3, 2025</p>
          <Button variant="outline" className="dark:text-white" disabled>Manage Devices</Button>
        </CardContent>
      </Card>
    </div>
  );
}