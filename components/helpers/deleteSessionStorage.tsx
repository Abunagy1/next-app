'use client';

import { useEffect } from 'react';

interface DeleteSessionStorageProps {
  keyArr: string[];
}

export function DeleteSessionStorage({ keyArr }: DeleteSessionStorageProps) {
  useEffect(() => {
    keyArr.forEach((key) => {
      sessionStorage.removeItem(key);
    });
  }, [keyArr.join()]);

  return null;
}