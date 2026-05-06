import { cn } from '@/app/lib/utils';

interface StatusChipProps {
  text: string;
  color?: string;
  bg?: string;
}

export default function StatusChip({ text, color, bg }: StatusChipProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', bg || 'bg-gray-100 dark:bg-gray-700', color || 'text-gray-800 dark:text-gray-200')}>
      {text}
    </span>
  );
}