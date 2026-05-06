'use client';
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/app/lib/utils';
interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}
export function FilterSection({ title, defaultOpen = false, children, className }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("border-b dark:border-gray-700", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-md bg-primary/30 p-4 font-medium text-gray-800 dark:bg-gray-700 dark:text-white"
      >
        <span>{title}</span>
        <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}