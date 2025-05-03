import { SidebarProvider } from '@workspace/ui/components/sidebar';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { isAdminUser } from '~/server/auth';

import AdminSidebar from './admin-sidebar';

export default async function Layout({ children }: { children: ReactNode }) {
  const isAdmin = await isAdminUser();
  if (!isAdmin) {
    notFound();
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex flex-1 flex-col">{children}</main>
    </SidebarProvider>
  );
}
