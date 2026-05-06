'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const options = ['all', 'upcoming', 'past', 'cancelled'] as const;

export default function BookingFilterSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentFilter = searchParams.get('filter') || 'all';

  const onSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') {
        params.set('filter', value);
      } else {
        params.delete('filter');
      }
      // Preserve the active tab (flights / stays)
      const tab = params.get('tab') || 'flights';
      params.set('tab', tab);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <select
      className="h-min bg-transparent p-0 text-[0.875rem] font-semibold dark:text-white"
      value={currentFilter}
      onChange={onSelect}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt.charAt(0).toUpperCase() + opt.slice(1)}
        </option>
      ))}
    </select>
  );
}