'use client';

import type { PublicUser } from '@workspace/core/types';
import { createContext, useCallback, useContext } from 'react';

import { api } from '~/trpc/client';

export interface AuthContext {
  currentUser: PublicUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refetch?: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContext | null>(null);

export function AuthProvider({ children, currentUser: initialData }: { children: React.ReactNode; currentUser?: PublicUser | null }) {
  const {
    data: currentUser,
    isPending,
    refetch,
  } = api.auth.currentUser.useQuery(undefined, {
    initialData: initialData ?? undefined,
    retry: false,
  });

  const signOutMut = api.auth.signOut.useMutation();

  const hanldeSignOut = useCallback(async () => {
    await signOutMut.mutateAsync();
    localStorage.clear();
    window.location.href = '/';
  }, [signOutMut]);

  const handleRefetch = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return (
    <AuthContext.Provider
      value={{
        currentUser: currentUser ?? null,
        isAuthenticated: !!currentUser,
        isLoading: isPending,
        refetch: handleRefetch,
        signOut: hanldeSignOut,
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
