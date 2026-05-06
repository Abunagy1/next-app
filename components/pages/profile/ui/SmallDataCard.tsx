"use client";

import Image from 'next/image';
import { StaticImageData } from 'next/image';

interface SmallDataCardProps {
  imgSrc: string | StaticImageData;
  title: string;
  data: React.ReactNode;
}

export function SmallDataCard({ imgSrc, title, data }: SmallDataCardProps) {
  return (
    <div className="flex items-center gap-[8px]">
      <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[4px] bg-primary/20">
        <Image src={imgSrc} width={22} height={22} alt="" />
      </div>
      <div>
        <p className="text-[0.75rem] font-semibold text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="font-medium text-gray-800 dark:text-gray-200">
          {data}
        </p>
      </div>
    </div>
  );
}