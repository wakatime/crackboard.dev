'use client';

import { APP_DOMAIN } from '@workspace/core/constants';
import { Button } from '@workspace/ui/components//button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import Link from 'next/link';
import React from 'react';

export default function InviteCodeNeeded() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log In to {APP_DOMAIN}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-1 text-center">
          <p>This leaderboard is invite only.</p>
          <p>Ask the owner for a login link.</p>
        </div>
        <Button className="mt-2 w-full" variant="link" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
