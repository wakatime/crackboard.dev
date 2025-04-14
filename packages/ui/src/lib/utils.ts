import type { ClassValue } from 'clsx';
import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { a11yDark, a11yLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { twMerge } from 'tailwind-merge';

import type { SidebarItem } from '../types/sidebar';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isSidebarItemActive = (item: Pick<SidebarItem, 'href' | 'exact' | 'includePaths' | 'excludePaths'>, pathname: string) => {
  let isActive = matchPath(item.href, pathname, item.exact);
  if (!isActive && item.includePaths && item.includePaths.length > 0) {
    isActive = item.includePaths.findIndex((match) => matchPath(match.href, pathname, match.exact)) !== -1;
  }
  if (isActive && item.excludePaths && item.excludePaths.length > 0) {
    isActive = item.excludePaths.findIndex((path) => matchPath(path.href, pathname, path.exact)) === -1;
  }
  return isActive;
};

const matchPath = (href: string, pathname: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href));

export const getCodeHighlighterStyle = (theme: 'light' | 'dark'): Record<string, CSSProperties> => {
  return theme === 'dark' ? a11yDark : a11yLight;
};
