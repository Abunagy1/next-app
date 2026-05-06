'use client';

import { useEffect } from 'react';

interface SetSessionStorageProps {
  obj: Record<string, any>;
}

export function SetSessionStorage({ obj }: SetSessionStorageProps) {
  useEffect(() => {
    Object.entries(obj).forEach(([key, value]) => {
      sessionStorage.setItem(key, String(value));
    });
  }, [Object.values(obj)]);

  return null;
}