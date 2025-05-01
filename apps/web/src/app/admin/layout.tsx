import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { isAdminUser } from '~/server/auth';

export default async function Layout({ children }: { children: ReactNode }) {
  const isAdmin = await isAdminUser();
  if (!isAdmin) {
    notFound();
  }

  return <div>{children}</div>;
}
