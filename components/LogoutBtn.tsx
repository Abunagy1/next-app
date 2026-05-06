'use client';

import { Button } from '@/components/ui/button';
import { debounce } from '@/app/lib/utils';
import { handleLogout } from '@/app/lib/eventHandlers/handleLogout';
import { ReactNode } from 'react';

interface LogoutBtnProps {
  btnContent?: ReactNode;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onSuccess?: () => void;
  onError?: () => void;
  [key: string]: any;
}

export default function LogoutBtn({
  btnContent,
  className,
  size = 'default',
  variant = 'default',
  onSuccess = () => {},
  onError = () => {},
  ...props
}: LogoutBtnProps) {
  return (
    <Button
      className={className}
      onClick={debounce(() => handleLogout(null, onSuccess, onError))}
      type="button"
      size={size}
      variant={variant}
      {...props}
    >
      {btnContent || 'Logout'}
    </Button>
  );
}