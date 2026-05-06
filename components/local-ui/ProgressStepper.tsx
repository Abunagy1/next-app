'use client';

import { cn } from '@/app/lib/utils';

interface Step {
  label: string;
  value: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStepValue: string;
  onCurrentValueChange?: (value: string) => void;
  className?: string;
}

export default function ProgressStepper({
  steps,
  currentStepValue,
  onCurrentValueChange,
  className,
}: ProgressStepperProps) {
  const currentIndex = steps.findIndex((step) => step.value === currentStepValue);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      <div className="relative flex justify-between">
        {steps.map((step, idx) => (
          <button
            key={step.value}
            onClick={() => onCurrentValueChange?.(step.value)}
            className="relative flex flex-col items-center"
            disabled={idx > currentIndex}
          >
            <div className={cn('z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-white text-sm font-semibold transition-colors dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300', idx <= currentIndex ? 'border-primary bg-primary text-white dark:bg-primary dark:text-white' : 'border-gray-300 text-gray-500 dark:border-gray-600 dark:text-gray-400')}>
              {idx + 1}
            </div>
            <span className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">
              {step.label}
            </span>
          </button>
        ))}
        <div className="absolute left-0 top-5 h-0.5 w-full -translate-y-1/2 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}