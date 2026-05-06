'use client';

import { Button } from '@/components/ui/button';
import { useFormStatus } from 'react-dom';
import { cn } from '@/app/lib/utils';

interface SubmitBtnProps {
  formId?: string;
  customTitle?: {
    default: string;
    onSubmitting: string;
  };
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  disabled?: boolean;
  type?: 'submit' | 'button' | 'reset';
  [key: string]: any;
}

export function SubmitBtn({
  formId,
  customTitle = { default: 'Submit', onSubmitting: 'Submitting...' },
  className,
  variant,
  disabled,
  ...props
}: SubmitBtnProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      form={formId}
      disabled={disabled || pending}
      size="lg"
      type="submit"
      className={cn(className)}
      variant={variant}
      {...props}
    >
      {pending ? customTitle.onSubmitting : customTitle.default}
    </Button>
  );
}