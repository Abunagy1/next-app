'use client';

import { useEffect } from 'react';
import { deleteCookiesAction } from '@/app/lib/actions/cookiesActions';
import routes from '@/data/routes.json';

interface DeleteLocalStorageAndCookiesProps {
  email: string;
}

export default function DeleteLocalStorageAndCookies({ email }: DeleteLocalStorageAndCookiesProps) {
  useEffect(() => {
    async function deletes() {
      await deleteCookiesAction(['ces', 'sai']);
      localStorage.removeItem('sendAgainAt');
      const emailsSentStr = localStorage.getItem('emailsSent');
      if (emailsSentStr) {
        const emailsSent = JSON.parse(emailsSentStr);
        if (emailsSent && typeof emailsSent === 'object') {
          delete emailsSent[email];
          localStorage.setItem('emailsSent', JSON.stringify(emailsSent));
        }
      }
      setTimeout(() => {
        window.location.replace(routes.profile.path);
      }, 2000);
    }
    deletes();
  }, [email]);

  return null;
}