'use client';

import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import BackButton from './back-button';

export default function TitleBar({
  title,
  trailing,
  leading,
  hideBackButton,
  bottom,
  homeHref,
}: {
  bottom?: ReactNode;
  hideBackButton?: boolean;
  leading?: ReactNode;
  title: string | ReactNode;
  trailing?: ReactNode;
  homeHref?: string;
}) {
  const searchParams = useSearchParams();

  const hideShell = useMemo(() => searchParams.get('hideShell') === 'true', [searchParams]);

  if (hideShell) {
    return null;
  }

  return (
    <header className="bg-card sticky top-0 z-50 grid border-b">
      <div className="flex h-14 items-center gap-2 px-2">
        {leading ?? (!hideBackButton && <BackButton homeHref={homeHref} />)}
        <div className="grid flex-1 px-2">
          {typeof title === 'string' ? <p className="truncate text-lg font-bold leading-6">{title}</p> : title}
        </div>
        {trailing}
      </div>
      {bottom}
    </header>
  );
}
