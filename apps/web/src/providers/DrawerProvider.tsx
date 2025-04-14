'use client';

import { Sheet, SheetContent, SheetTitle } from '@acme/ui/components/ui/sheet';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

import AppSidebar from '~/components/AppSidebar';

export interface DrawerContextValue {
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

export default function DrawerProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  return (
    <DrawerContext.Provider value={{ isDrawerOpen, setIsDrawerOpen }}>
      {children}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="flex w-[348px] max-w-[calc(100vw-100px)] flex-col overflow-y-auto p-0" side="left">
          <SheetTitle className="sr-only">Sidebar</SheetTitle>
          <AppSidebar />
        </SheetContent>
      </Sheet>
    </DrawerContext.Provider>
  );
}

export const useDrawer = () => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must use inside DrawerProvider');
  }
  return context;
};
