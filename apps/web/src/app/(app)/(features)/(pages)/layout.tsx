import type { ReactNode } from 'react';

import BadgesProvider from '~/providers/BadgesProvider';
import DrawerProvider from '~/providers/DrawerProvider';

import AppShell from './_components/app-shell';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <BadgesProvider>
      <DrawerProvider>
        <AppShell>{children}</AppShell>
      </DrawerProvider>
    </BadgesProvider>
  );
}
