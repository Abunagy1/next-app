'use client';

import { cn } from '@/app/lib/utils';

interface EmptyResultProps {
  message?: string;
  description?: string;
  className?: string;
}

export function EmptyResult({ message, description, className }: EmptyResultProps) {
  return (
    <div className={cn('flex h-[212px] min-h-[200px] w-[378px] min-w-[300px] flex-col items-center justify-center gap-4 rounded-xl border bg-gray-50 p-6 text-gray-700 shadow-inner dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300', className)}>
      <div className="text-center text-2xl font-semibold dark:text-white">
        {message || 'No Result Found'}
      </div>
      <p className="max-w-md text-center text-base dark:text-gray-400">
        {description || 'No result found. Please try again.'}
      </p>
    </div>
  );
}