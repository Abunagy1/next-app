// 'use client';

// import { useEffect, useState } from 'react';
// import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

// export default function ThemeToggle() {
//   const [isDark, setIsDark] = useState(false);

//   useEffect(() => {
//     // Check local storage or system preference on mount
//     const stored = localStorage.getItem('theme');
//     const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
//     const initial = stored === 'dark' || (!stored && prefersDark);
//     setIsDark(initial);
//     document.documentElement.classList.toggle('dark', initial);
//   }, []);

//   const toggleTheme = () => {
//     const newDark = !isDark;
//     setIsDark(newDark);
//     document.documentElement.classList.toggle('dark', newDark);
//     localStorage.setItem('theme', newDark ? 'dark' : 'light');
//   };

//   return (
//     <button
//       onClick={toggleTheme}
//       className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
//       aria-label="Toggle theme"
//     >
//       {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
//     </button>
//   );
// }
'use client';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored === 'dark' || (!stored && prefersDark);
    setIsDark(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);
  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };
  return (
    <button
      onClick={toggleTheme}
      className="p-3 rounded-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg hover:scale-110 transition-all duration-200 border border-gray-200 dark:border-gray-700"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <SunIcon className="w-6 h-6 text-yellow-500" />
      ) : (
        <MoonIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      )}
    </button>
  );
}