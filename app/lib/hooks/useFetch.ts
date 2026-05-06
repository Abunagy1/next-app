import { useEffect, useState } from 'react';

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

interface UseFetchReturn<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  retry: () => void;
}

export default function useFetch<T = any>(
  url: string | URL | globalThis.Request,
  init?: FetchOptions
): UseFetchReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [trying, setTrying] = useState<number>(1);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch(url, {
          ...init,
          headers: { ...init?.headers, 'Content-Type': 'application/json' },
          signal: controller.signal,
        });
        const json = await res.json();
        if (json.success === false) {
          throw new Error(json.message);
        }
        setData(json);
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        setError(e.message);
      }
      setLoading(false);
    }
    fetchData();
    return () => controller.abort();
  }, [url, init?.body, trying]);

  function retry() {
    setTrying((prev) => prev + 1);
  }

  return { data, error, loading, retry };
}