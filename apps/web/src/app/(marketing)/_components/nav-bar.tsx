import { Button } from '@acme/ui/components/ui/button';
import Link from 'next/link';

export default function NavBar() {
  return (
    <header>
      <div className="container flex h-20 max-w-screen-xl flex-row items-center px-4 md:px-8">
        <div className="flex-1">
          <Link className="text-foreground text-lg font-bold" href="/">
            wonderful.dev
          </Link>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/login" prefetch={false}>
              Log In
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
