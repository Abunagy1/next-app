"use client";
import { useState, useEffect, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { updateUserSettingsAction } from "@/app/lib/actions/updateProfileActions";
import { toast } from "sonner";
import { useActionState } from "react";
import { useTheme } from "next-themes";

export default function AppearanceSettings({
  initialSettings,
}: {
  initialSettings?: any;
}) {
  const [state, formAction] = useActionState(updateUserSettingsAction, null);
  const [isPending, startTransition] = useTransition();
  const { setTheme, theme: currentTheme } = useTheme();

  // Local state to reflect changes immediately
  const [settings, setSettings] = useState({
    theme: initialSettings?.theme || "system",
    accentColor: initialSettings?.accentColor || "#2563eb",
    fontSize: initialSettings?.fontSize || "base",
    density: initialSettings?.density || "comfortable",
    reduceMotion: initialSettings?.reduceMotion || false,
  });

  useEffect(() => {
    if (state?.success) toast.success(state.message);
  }, [state]);

  const handleChange = (key: string, value: any) => {
    // 1. Update local state instantly
    setSettings((prev) => ({ ...prev, [key]: value }));

    // 2. Save to database
    const fd = new FormData();
    fd.append(key, typeof value === "boolean" ? String(value) : value);
    startTransition(() => {
      formAction(fd);
    });

    // 3. Apply theme immediately if the key is 'theme'
    if (key === "theme") {
      setTheme(value);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Theme</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={settings.theme}
            onChange={(e) => handleChange("theme", e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Accent Color</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="color"
            value={settings.accentColor}
            onChange={(e) => handleChange("accentColor", e.target.value)}
            className="dark:bg-gray-700 dark:border-gray-600"
          />
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Font Size</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={settings.fontSize}
            onChange={(e) => handleChange("fontSize", e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
          >
            <option value="sm">Small</option>
            <option value="base">Default</option>
            <option value="lg">Large</option>
          </select>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Layout Density</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={settings.density}
            onChange={(e) => handleChange("density", e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2"
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </CardContent>
      </Card>

      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold dark:text-white">Reduce Motion</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-muted-foreground dark:text-gray-400">
            Minimize UI animations for accessibility
          </span>
          <Switch
            checked={settings.reduceMotion}
            onCheckedChange={(val) => handleChange("reduceMotion", val)}
            disabled={isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}