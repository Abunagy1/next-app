'use client';

import { cn } from '@/app/lib/utils';
import LoginForm from './pages/login/LoginForm';

interface AuthenticationCardProps {
  className?: string;
}

export function AuthenticationCard({ className }: AuthenticationCardProps) {
  return (
    <div className={cn('flex flex-col gap-4 rounded-[12px] border bg-white p-[24px] shadow-lg dark:bg-gray-800 dark:border-gray-700', className)}>
      <h3 className="text-[1.25rem] font-bold dark:text-white">Login or Sign up to book</h3>
      <div>
        <LoginForm  />
      </div>
    </div>
  );
}