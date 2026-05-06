'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface BookingCardProps {
  bgImg: string;
  placeName: string;
  cost: number | string;
  subTitle: string;
  btnTitle: string;
  btnHref: string;
}

export function BookingCard({
  bgImg,
  placeName,
  cost,
  subTitle,
  btnTitle,
  btnHref,
}: BookingCardProps) {
  return (
    <div
      style={{
        backgroundImage: `url("${bgImg}")`,
      }}
      className="flex h-[420px] min-w-[250px] items-end rounded-[12px] bg-secondary bg-cover p-[24px] dark:bg-gray-700">
      <div className="w-full">
        <div className="mb-[16px] flex items-end justify-between text-white">
          <div>
            <h4 className="text-[1.5rem] font-semibold dark:text-white">{placeName}</h4>
            <p className="text-[0.875rem] dark:text-gray-300">{subTitle}</p>
          </div>
          <p className="whitespace-nowrap text-[1.5rem] font-semibold dark:text-white">$ {cost}</p>
        </div>
        <Button asChild className="mx-auto w-full dark:bg-primary dark:hover:bg-primary/80 dark:text-white">
          <Link href={btnHref}>{btnTitle}</Link>
        </Button>
      </div>
    </div>
  );
}