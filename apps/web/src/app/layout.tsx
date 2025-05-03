import '@workspace/ui/globals.css';

import { authenticatedUserFromRequest } from '@workspace/core/backend/auth';
import { userToPublicUser } from '@workspace/core/backend/helpers/users';
import { APP_DESC, APP_DOMAIN } from '@workspace/core/constants';
import type { PublicUser } from '@workspace/core/types';
import { Toaster } from '@workspace/ui/components/sonner';
import { TooltipProvider } from '@workspace/ui/components/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import HolyLoader from 'holy-loader';
import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google';

import { AuthProvider } from '~/providers/auth-providers';
import ThemeProvider from '~/providers/theme-provider';
import TrpcProvider from '~/providers/trpc-provider';

const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: APP_DOMAIN,
  description: APP_DESC,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let currentUser: PublicUser | null = null;

  const user = await authenticatedUserFromRequest();
  if (user) {
    currentUser = await userToPublicUser(user);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(fontSans.variable, 'bg-background flex min-h-screen flex-col font-sans antialiased')}>
        <HolyLoader color="#2666FF" height={3} showSpinner={false} ignoreSearchParams zIndex={99999} />
        <TrpcProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <TooltipProvider>
              <AuthProvider currentUser={currentUser}>{children}</AuthProvider>
            </TooltipProvider>
          </ThemeProvider>
        </TrpcProvider>
        <Toaster />
      </body>
    </html>
  );
}
