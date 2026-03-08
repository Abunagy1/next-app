'use client';
import { signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
export default function SignOutPage() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  // useEffect(() => {
  //   signOut({ callbackUrl: '/login?deleted=true' });
  // }, []);
  useEffect(() => {
    signOut({ callbackUrl: reason === 'deleted' ? '/login?deleted=true' : '/' });
  }, [reason]);
  return <div className="text-center p-8">Signing out...</div>;
}