import { APP_SCHEME } from '@acme/core/constants';
import { Button } from '@acme/ui/components/ui/button';
import Link from 'next/link';

export default function TestLogInPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="container max-w-sm">
        <Button asChild variant="outline">
          <Link href={`${APP_SCHEME}login/test`} prefetch={false}>
            Mobile App Log In
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/login/test/web" prefetch={false}>
            Web Log In
          </Link>
        </Button>
      </div>
    </div>
  );
}
