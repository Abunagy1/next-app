'use client';

import { useEffect, useState } from 'react';

interface Card {
  id: string;
  cardType: string;
  last4Digits: string;
  validTill: string;
}

interface UseFetchCardsReturn {
  loading: boolean;
  cardData: Card[];
  fetchError: { status: boolean; message: string };
  tryAgain: () => void;
}

export default function useFetchCards(): UseFetchCardsReturn {
  const [cardData, setCardData] = useState<Card[]>([]);
  const [fetchError, setFetchError] = useState<{ status: boolean; message: string }>({
    status: false,
    message: '',
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [trying, setTrying] = useState<number>(1);

  useEffect(() => {
    const controller = new AbortController();
    async function getPaymentCards() {
      setLoading(true);
      try {
        const res = await fetch(
          process.env.NEXT_PUBLIC_BASE_URL + '/api/user/get_payment_cards',
          { next: { revalidate: 600 }, signal: controller.signal }
        );
        if (!res.ok) throw new Error(res.statusText);
        const data = await res.json();
        if (data.success === false) throw new Error(data.message);
        setFetchError({ status: false, message: '' });
        setCardData(data.data);
        setLoading(false);
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        setLoading(false);
        setFetchError({ status: true, message: err.message });
      }
    }
    getPaymentCards();
    return () => controller.abort();
  }, [trying]);

  function tryAgain() {
    setTrying(Date.now());
  }

  return { loading, cardData, fetchError, tryAgain };
}