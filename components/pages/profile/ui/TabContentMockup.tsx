"use client";
import { ReactNode } from 'react';

interface TabContentMockupProps {
  children: ReactNode;
  title: string;
}

export function TabContentMockup({ children, title }: TabContentMockupProps) {
  return (
    <div>
      <h2 className="mb-[16px] text-[2rem] font-bold">{title}</h2>
      <div className="flex flex-col gap-[32px]">{children}</div>
    </div>
  );
}