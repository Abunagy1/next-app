'use client';

import { useState } from 'react';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/app/lib/utils';

interface CounterProps {
  className?: string;
  defaultCount?: number;
  maxCount?: number;
  minCount?: number;
  getCount?: (count: number) => void;
}

export default function Counter({
  className,
  defaultCount = 0,
  maxCount = Infinity,
  minCount = -Infinity,
  getCount = () => {},
}: CounterProps) {
  const [count, setCount] = useState(() => defaultCount);

  const updateCount = (newCount: number) => {
    setCount(newCount);
    getCount(newCount);
  };

  function handleIncrement() {
    const c = Math.min(count + 1, maxCount);
    updateCount(c);
  }

  function handleDecrement() {
    const c = Math.max(count - 1, minCount);
    updateCount(c);
  }

  return (
    <div className={cn('flex h-8 w-fit items-center gap-2', className)}>
      <button className="h-full w-fit" onClick={handleDecrement}>
        <MinusCircle width={24} height={24} className="h-full w-full text-primary" />
      </button>
      <p className="text-md h-fit w-8 text-center font-bold">{count}</p>
      <button className="h-full w-fit" onClick={handleIncrement}>
        <PlusCircle width={24} height={24} className="h-full w-full text-primary" />
      </button>
    </div>
  );
}