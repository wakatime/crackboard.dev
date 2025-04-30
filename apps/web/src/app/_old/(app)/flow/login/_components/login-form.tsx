'use client';

import { APP_NAME } from '@acme/core/constants';
import { Button } from '@acme/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@acme/ui/components/ui/card';
import Link from 'next/link';
import React from 'react';

export default function LogInForm({ next }: { next?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Log In to {APP_NAME}</CardTitle>
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
        <Button className="mt-2 w-full" variant="link">
          <Link href="/">Back to Home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
