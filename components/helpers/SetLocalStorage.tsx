'use client';

import { useEffect } from 'react';

interface SetLocalStorageProps {
  obj: Record<string, any>;
}

export function SetLocalStorage({ obj }: SetLocalStorageProps) {
  useEffect(() => {
    Object.entries(obj).forEach(([key, value]) => {
      localStorage.setItem(key, String(value));
    });
  }, [Object.values(obj)]);

  return null;
}