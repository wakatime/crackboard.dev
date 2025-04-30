'use client';

import { Button } from '@acme/ui/components/ui/button';
import { useIsMobile } from '@acme/ui/hooks/use-mobile';
import { cn } from '@acme/ui/lib/utils';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

export default function FloatingButton({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const breakPoint1 = useIsMobile(1300);
  const breakPoint3 = useIsMobile(800);

  if (!breakPoint1) {
    return null;
  }

  return createPortal(
    <div
      className="fixed bottom-8 right-8 z-40"
      style={{
        transform: `translateY(${breakPoint3 ? '-4rem' : '0px'})`,
      }}
    >
      <Button
        size="icon"
        className={cn(
          'rounded-full transition-[color,background-color,transform] active:scale-90',
          breakPoint3 ? 'size-[60px] [&_svg]:size-6' : 'size-[72px] [&_svg]:size-7',
          className,
        )}
        onClick={onClick}
      >
        {children}
      </Button>
    </div>,
    document.body,
  );
}
