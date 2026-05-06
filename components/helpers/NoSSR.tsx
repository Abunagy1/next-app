'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const NoSsr = (props: { children: React.ReactNode }) => <React.Fragment>{props.children}</React.Fragment>;

interface NoSSRProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function NoSSR({ children, fallback }: NoSSRProps) {
  const DynamicNoSSR = dynamic(() => Promise.resolve(NoSsr), {
    ssr: false,
    loading: () => fallback,
  });
  return <DynamicNoSSR>{children}</DynamicNoSSR>;
}

export default NoSSR;