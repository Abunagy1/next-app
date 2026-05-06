'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // We disable the rule for this specific line as it is the required Next.js hydration pattern
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  // Avoid hydration mismatch by rendering nothing (or a skeleton) until mounted
  if (!mounted) {
    return <div className="w-12 h-12 p-3" />; // Placeholder to prevent layout shift
  }
  // resolvedTheme catches the actual theme when "system" is selected
  const currentTheme = theme === 'system' ? resolvedTheme : theme;
  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }
  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:scale-110 transition-all duration-200 border border-gray-200 dark:border-gray-700"
      aria-label="Toggle theme"
    >
      {currentTheme === 'dark' ? (
        <SunIcon className="w-6 h-6 text-yellow-500" />
      ) : (
        <MoonIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
}