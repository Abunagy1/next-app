'use client';

import { cn } from '@/app/lib/utils';
import { useEffect, useRef, useState } from 'react';

interface CountdownProps {
  currentTimeMs?: number;
  timeoutAtMs?: number;
  className?: string;
}

export default function Countdown({
  currentTimeMs = 0,
  timeoutAtMs = 60000,
  className,
  ...props
}: CountdownProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(() => {
    const now = currentTimeMs || Date.now();
    return Math.max(0, timeoutAtMs - now);
  });

  // Update remaining time when props change
  useEffect(() => {
    const now = currentTimeMs || Date.now();
    const newRemaining = Math.max(0, timeoutAtMs - now);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemainingTime(newRemaining);
  }, [currentTimeMs, timeoutAtMs]);

  // Start/stop interval based on remaining time
  useEffect(() => {
    if (remainingTime <= 0) return;

    intervalRef.current = setInterval(() => {
      setRemainingTime((prev) => Math.max(0, prev - 1000));
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [remainingTime]);

  // Clear interval when time reaches zero
  useEffect(() => {
    if (remainingTime <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [remainingTime]);

  const formatted = formatTimeFromMilliseconds(remainingTime);

  return (
    <div className={cn(className)} {...props}>
      {formatted}
    </div>
  );
}

function formatTimeFromMilliseconds(ms: number): string {
  if (ms <= 0) return '00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  if (hours > 0) {
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  return `${formattedMinutes}:${formattedSeconds}`;
}