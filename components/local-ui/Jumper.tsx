'use client';

import { useEffect, useRef } from 'react';

interface JumperProps {
  id: string;
  children?: React.ReactNode;
}

export default function Jumper({ id, children }: JumperProps) {
  const hasJumped = useRef(false);

  useEffect(() => {
    if (!hasJumped.current) {
      hasJumped.current = true;
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [id]);

  return children ? <>{children}</> : null;
}

export function jumpTo(id: string) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}