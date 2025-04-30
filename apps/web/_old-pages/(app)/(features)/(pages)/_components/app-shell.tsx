'use client';

import { useIsMobile } from '@acme/ui/hooks/use-mobile';
import { usePathname, useSearchParams } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';

import AppSidebar from '~/components/AppSidebar';

import RightSideBar from './right-side-bar';
import AppTabBar from './tab-bar';

const MIDDLE_COLUM_WIDTH = 600;

export default function AppShell({ children }: PropsWithChildren) {
  const searchParams = useSearchParams();
  const breakPoint1 = useIsMobile(1300);
  const breakPoint2 = useIsMobile(1100);
  const breakPoint3 = useIsMobile(800);
  const pathname = usePathname();

  const hideTabbar = useMemo(() => {
    if (pathname.startsWith('/chats/')) {
      return true;
    }
    return false;
  }, [pathname]);

  const offsetX = useMemo(() => (breakPoint2 ? 0 : breakPoint1 ? 100 : 0), [breakPoint1, breakPoint2]);
  const hideShell = useMemo(() => searchParams.get('hideShell') === 'true', [searchParams]);

  if (hideShell) {
    return <div className="flex w-full flex-col">{children}</div>;
  }

  return (
    <>
      {!breakPoint3 && (
        <div
          className="max-w-x fixed inset-0 left-1/2 border-x"
          style={{
            width: MIDDLE_COLUM_WIDTH + 2,
            transform: `translateX(-${offsetX}px) translateX(-50%) translateX(calc(-1 * var(--removed-body-scroll-bar-size, 0px) / 2))`,
          }}
        ></div>
      )}

      <div
        className="flex min-h-screen flex-1 flex-shrink-0 flex-col items-stretch"
        style={{
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '100%',
          maxWidth: !breakPoint3 ? MIDDLE_COLUM_WIDTH : undefined,
          transform: `translateX(-${offsetX}px)`,
        }}
      >
        {children}
      </div>

      {!breakPoint3 && (
        <div
          className="fixed bottom-0 left-1/2 top-0 flex flex-col items-stretch overflow-y-auto"
          style={{
            width: breakPoint1 ? 72 : 260,
            transform: `translateX(-${offsetX}px) translateX(-${MIDDLE_COLUM_WIDTH / 2}px) translateX(-100%) translateX(calc(-1 * var(--removed-body-scroll-bar-size, 0px) / 2))`,
          }}
        >
          <AppSidebar collapsed={breakPoint1} />
        </div>
      )}

      {!breakPoint2 && (
        <div
          className="fixed left-1/2 top-0 flex max-h-screen flex-col items-stretch gap-4 overflow-y-auto p-4 pr-0"
          style={{
            width: 340,
            transform: `translateX(-${offsetX}px) translateX(${MIDDLE_COLUM_WIDTH / 2}px) translateX(calc(-1 * var(--removed-body-scroll-bar-size, 0px) / 2))`,
          }}
        >
          <RightSideBar />
        </div>
      )}

      {breakPoint3 && !hideTabbar && <AppTabBar />}
    </>
  );
}
