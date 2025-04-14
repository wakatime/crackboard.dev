'use client';

import { ChevronRightIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '../lib/utils';

export interface SettingsMenuListProps {
  list: {
    href?: string;
    name: string;
    icon?: ReactNode;
    trailing?: ReactNode;
    onClick?: () => void;
    variant?: 'default' | 'destructive';
  }[];
}

export default function SettingsMenuList({ list }: SettingsMenuListProps) {
  return (
    <div className="my-2 grid">
      {list.map((item) => {
        if (item.href) {
          return (
            <Link href={item.href} key={item.name} onClick={item.onClick} className="hover:bg-secondary flex h-12 items-center gap-4 px-4">
              {item.icon ? <span className="[&>svg]:h-6 [&>svg]:w-6">{item.icon}</span> : null}
              <p className="flex-1 truncate font-medium">{item.name}</p>
              {item.trailing}
              <ChevronRightIcon className="text-muted-foreground h-6 w-6" />
            </Link>
          );
        }
        return (
          <button
            key={item.name}
            onClick={item.onClick}
            className={cn('hover:bg-secondary flex h-12 items-center gap-4 px-4 text-left', {
              'text-destructive hover:bg-destructive/10': item.variant === 'destructive',
            })}
          >
            {item.icon ? <span className="[&>svg]:h-6 [&>svg]:w-6">{item.icon}</span> : null}
            <p className="flex-1 truncate font-medium">{item.name}</p>
            {item.trailing}
          </button>
        );
      })}
    </div>
  );
}
