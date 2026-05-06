'use client';

import { useRef, useEffect, useState, Children } from 'react';
import { cn } from '@/app/lib/utils';

interface CarouselProps {
  children: React.ReactNode;
  className?: string;
}

export function Carousel({ children, className }: CarouselProps) {
  return (
    <div
      className={cn(
        'w-[600px] relative h-[600px] bg-slate-500 overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CarouselItemProps {
  children: React.ReactNode;
  className?: string;
}

export function CarouselItem({ children, className }: CarouselItemProps) {
  return (
    <div
      className={cn(
        'shrink-0 snap-end w-full h-full bg-primary/50 text-9xl font-bold',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CarouselContentProps {
  children: React.ReactNode;
  className?: string;
  indicator?: boolean;
  interval?: number;
  gap?: number;
}

export function CarouselContent({
  children,
  className,
  indicator = true,
  interval = 5000,
  gap = 0,
}: CarouselContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const items = Children.count(children);
  const [active, setActive] = useState(0);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const int = setInterval(() => {
      setActive((active) => active + 1);
      setActiveDot(active % items);
      const scroll = (active % items) * (contentRef.current?.offsetWidth || 0 + gap);
      if (contentRef.current) contentRef.current.scrollTo(scroll, 0);
    }, interval);
    return () => clearInterval(int);
  }, [items, interval, active, gap]);

  return (
    <>
      <div
        ref={contentRef}
        className={cn(
          'scroll-smooth w-full flex snap-x snap-mandatory overflow-hidden h-full',
          className
        )}
      >
        {children}
      </div>
      {indicator && (
        <div
          className="absolute bottom-4 -translate-x-1/2 left-1/2 flex sm:gap-2 2xsm:gap-1 gap-0"
          ref={dotRef}
        >
          {Array.from({ length: items }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'transition-all scale-50 2xsm:scale-75 sm:scale-100 duration-500 w-[10px] h-[10px] rounded-full',
                activeDot === i ? 'bg-primary w-[30px]' : 'bg-white'
              )}
            />
          ))}
        </div>
      )}
    </>
  );
}