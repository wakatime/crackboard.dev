import { authenticatedUserFromRequest } from '@acme/core/backend/auth';
import { APP_NAME } from '@acme/core/constants';
import type { Metadata } from 'next';
import React from 'react';

import { AuthProvider } from '~/providers/AuthProvider';
import { userToPublicUserCached } from '~/utils/server';

export const metadata: Metadata = {
  title: APP_NAME,
};

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await authenticatedUserFromRequest();
  const publicUser = currentUser ? await userToPublicUserCached(currentUser) : null;

  return <AuthProvider currentUser={publicUser}>{children}</AuthProvider>;
}
