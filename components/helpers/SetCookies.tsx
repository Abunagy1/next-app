'use client';

import { useEffect, useRef } from 'react';
import { setCookiesAction } from '@/app/lib/actions/cookiesActions';
import { objDeepCompare } from '@/app/lib/utils';

interface Cookie {
  name: string;
  value: string;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  httpOnly?: boolean;
  maxAge?: number;
  partitioned?: boolean;
}

interface SetCookiesProps {
  cookies?: Cookie[];
}

export default function SetCookies({ cookies = [] }: SetCookiesProps) {
  const prevCookiesRef = useRef<string>('[]');

  const cookieKeyVal = cookies.map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
  }));
  const stringified = JSON.stringify(cookieKeyVal);

  useEffect(() => {
    (async () => {
      const currentCookiesStr = stringified;
      if (!objDeepCompare(prevCookiesRef.current, currentCookiesStr)) {
        await setCookiesAction(stringified);
        prevCookiesRef.current = currentCookiesStr;
      }
    })();
  }, [stringified]);

  return null;
}