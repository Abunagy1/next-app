'use client';

import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Fragment } from 'react';
import { usePathname } from 'next/navigation';

interface BreadcrumbUIProps {
  className?: string;
}

export function BreadcrumbUI({ className }: BreadcrumbUIProps) {
  const pathname = usePathname().split('/');
  return (
    // @ts-ignore – BreadcrumbContent props type mismatch
    <Breadcrumb className={className}>
      {/* @ts-ignore – BreadcrumbContent props type mismatch */}
      <BreadcrumbList>
        {pathname.map((path, i, arr) => {
          const link = path ? pathname.slice(0, i + 1).join('/') : '/';
          if (arr.length - 1 === i) {
            return (
              <BreadcrumbItem key={path}>
                {/* @ts-ignore – BreadcrumbContent props type mismatch */}
                <BreadcrumbPage>{path}</BreadcrumbPage>
              </BreadcrumbItem>
            );
          }
          return (
            <Fragment key={path}>
              <BreadcrumbItem>
                {/* @ts-ignore – BreadcrumbContent props type mismatch */}
                <BreadcrumbLink className="text-tertiary" asChild>
                  <Link href={link}>{path || 'Home'}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {/* @ts-ignore – BreadcrumbContent props type mismatch */}
              <BreadcrumbSeparator />
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}