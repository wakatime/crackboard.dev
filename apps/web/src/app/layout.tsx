import '@acme/ui/globals.css';
import 'core-js/features/array/to-reversed';
import 'core-js/features/array/to-sorted';
import 'core-js/features/array/to-spliced';

import { APP_NAME } from '@acme/core/constants';
import { Toaster as SonnerToaster } from '@acme/ui/components/ui/sonner';
import { Toaster } from '@acme/ui/components/ui/toaster';
import { TooltipProvider } from '@acme/ui/components/ui/tooltip';
import { cn } from '@acme/ui/lib/utils';
import UpdateHistory from '@acme/ui/providers/navigation-provider';
import ThemeProvider from '@acme/ui/providers/theme-provider';
import HolyLoader from 'holy-loader';
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';

import TrpcProvider from '~/providers/TrpcProvider';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: APP_NAME,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn('bg-background flex min-h-screen flex-col overflow-y-scroll font-sans antialiased', fontSans.variable)}
        suppressHydrationWarning
        style={{
          paddingRight: `calc(0 - var(--removed-body-scroll-bar-size))`,
        }}
      >
        <HolyLoader color="#2666FF" height={3} showSpinner={false} ignoreSearchParams zIndex={99999} />
        <TrpcProvider>
          <ThemeProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <SonnerToaster />
            <Toaster />
          </ThemeProvider>
        </TrpcProvider>
        <UpdateHistory />
      </body>
    </html>
  );
}
