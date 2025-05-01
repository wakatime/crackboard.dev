'use client';

import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

import { useAuth } from '~/providers/auth-providers';

export default function Page() {
  const { currentUser, signOut } = useAuth();
  return (
    <div>
      <p>Current user</p>
      <pre className="bg-secondary border p-4">{JSON.stringify(currentUser, null, 2)}</pre>
      {currentUser ? (
        <Button variant="destructive" onClick={() => signOut()}>
          Sign Out
        </Button>
      ) : (
        <Button asChild>
          <Link href="/flow/login">Log In</Link>
        </Button>
      )}
    </div>
  );
}
