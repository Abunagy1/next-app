import { CheckCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface SuccessMessageProps {
  className?: string;
  message: string;
}

export function SuccessMessage({ className, message }: SuccessMessageProps) {
  return (
    <div
      className={cn(
        'flex text-green-800 text-sm rounded-lg p-3 min-h-[48px] items-center bg-green-100 space-x-1 font-medium',
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <CheckCircle className="h-5 w-5" />
      <div>{message}</div>
    </div>
  );
}