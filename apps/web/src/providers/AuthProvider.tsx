'use client';

import type { PublicUser } from '@acme/core/types';
import FullScreenLoader from '@acme/ui/components/full-screen-loader';
import { Button } from '@acme/ui/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';

import { api } from '~/trpc/client';

const authRequiredPaths: { exact?: boolean; href: string }[] = [
  { href: '/chats' },
  { href: '/notifications' },
  { href: '/connect-people' },
  { href: '/settings' },
  { href: '/admin' },
];

export interface AuthContext {
  currentUser: PublicUser | null;
  isAuthenticated: boolean | undefined;
  isLoading: boolean;
  refetch?: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({
  children,
  currentUser: initialCurrentUser,
}: {
  children: React.ReactNode;
  currentUser?: PublicUser | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const userQuery = api.auth.currentUser.useQuery(undefined, {
    initialData: initialCurrentUser ?? undefined,
    retry: false,
  });

  const signOutMut = api.auth.signout.useMutation();
  const isAuthRequiredRoute = useMemo(
    () => authRequiredPaths.findIndex((path) => (path.exact ? path.href === pathname : pathname.startsWith(path.href))) !== -1,
    [pathname],
  );

  const signOut = useCallback(async () => {
    await signOutMut.mutateAsync();
    router.push('/');
    router.refresh();
  }, [router, signOutMut]);

  useEffect(() => {
    if (!userQuery.isSuccess || typeof window === 'undefined') {
      return;
    }
    if (isAuthRequiredRoute && !userQuery.data) {
      const next = window.location.href;
      const params = new URLSearchParams({
        next,
      });
      router.replace(`/flow/login?${params.toString()}`);
    }
  }, [isAuthRequiredRoute, pathname, router, userQuery.data, userQuery.isSuccess]);

  if (userQuery.isPending) {
    return <FullScreenLoader />;
  }

  if (userQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Something went wrong!</p>
        <Button onClick={() => signOut()} disabled={signOutMut.isPending}>
          Sign Out
        </Button>
      </div>
    );
  }

  if (isAuthRequiredRoute && !userQuery.data) {
    return <FullScreenLoader />;
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser: userQuery.data ?? null,
        isAuthenticated: !!userQuery.data,
        isLoading: userQuery.isPending,
        refetch: () => {
          void userQuery.refetch();
        },
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth can only be used inside AuthProvider');
  }
  return ctx;
}
