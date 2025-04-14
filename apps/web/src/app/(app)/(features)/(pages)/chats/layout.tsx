import type { ReactNode } from 'react';

export const dynamic = 'force-static';

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  return children;
}
