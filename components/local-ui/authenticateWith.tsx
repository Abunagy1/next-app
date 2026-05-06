'use client';

import {
  authenticateWithGoogle,
  authenticateWithFacebook,
  authenticateWithApple
} from '@/app/lib/actions/authenticateActions';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AuthenticateWithProps {
  message?: string;
}

export function AuthenticateWith({ message }: AuthenticateWithProps) {
  return (
    <>
      <div className="relative h-auto">
        {message && (
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 text-sm inline-block bg-white dark:bg-gray-800 rounded-lg px-3 py-1">
            {message}
          </span>
        )}
        <Separator  />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <form action={authenticateWithFacebook} className="w-full">
          <Button className="w-full" variant="outline" type="submit">
            <Image
              src="/travel/icons/facebook.svg"
              alt="facebook_icon"
              height={24}
              width={24}
            />
          </Button>
        </form>
        <form action={authenticateWithGoogle} className="w-full">
          <Button className="w-full" variant="outline" type="submit">
            <Image
              src="/travel/icons/google.svg"
              alt="google_icon"
              height={24}
              width={24}
            />
          </Button>
        </form>
        <form action={authenticateWithApple}>
          <Button variant="outline" type="submit">
            <Image src="/travel/icons/apple.svg" alt="apple_icon" height={24} width={24} />
          </Button>
        </form>
      </div>
    </>
  );
}