'use client';

import { APP_DOMAIN } from '@workspace/core/constants';
import { Button } from '@workspace/ui/components//button';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import Link from 'next/link';
import React from 'react';

export default function LogInForm({ next }: { next?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log In to {APP_DOMAIN}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link
            className="w-full"
            href={{
              pathname: '/login',
              query: {
                next: next ?? '/',
              },
            }}
          >
            Log in with WakaTime
          </Link>
        </Button>
        <Button className="mt-2 w-full" variant="link" asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
