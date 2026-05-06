'use client';

import { SessionProvider } from 'next-auth/react';
import { Provider as ReduxProvider } from 'react-redux';
import { makeStore } from '@/reduxStore/store';
import { ThemeProvider } from "next-themes";

const store = makeStore();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ReduxProvider store={store}>
        {/* ThemeProvider goes inside Redux/Session, wrapping the children */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </ReduxProvider>
    </SessionProvider>
  );
}