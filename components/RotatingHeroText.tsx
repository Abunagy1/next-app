'use client';
// this component is to cycles through a list of phrases,
import { useState, useEffect } from 'react';

interface RotatingHeroTextProps {
  phrases: string[];
  interval?: number;         // milliseconds between changes
  className?: string;
}

export default function RotatingHeroText({
  phrases,
  interval = 3000,
  className = '',
}: RotatingHeroTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % phrases.length);
    }, interval);
    return () => clearInterval(timer);
  }, [phrases, interval]);

  return (
    <span className={`inline-block transition-opacity duration-700 ${className}`}>
      {phrases[currentIndex]}
    </span>
  );
}