import { authenticatedUserFromRequest } from '@workspace/core/backend/auth';
import { redirect, RedirectType } from 'next/navigation';

import PageClient from './page-client';

export default async function Page() {
  const user = await authenticatedUserFromRequest();
  if (!user) {
    redirect('/flow/login', RedirectType.replace);
  }
  return <PageClient />;
}
