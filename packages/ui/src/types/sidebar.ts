import type { ReactNode } from 'react';

export interface SidebarItem {
  name: string;
  href: string;
  icon?: ReactNode;
  exact?: boolean;
  activeIcon?: ReactNode;
  excludePaths?: { exact?: boolean; href: string }[];
  includePaths?: { exact?: boolean; href: string }[];
  subMenu?: Omit<SidebarItem, 'subMenu'>[];
  notificationBadge?: number;
}
