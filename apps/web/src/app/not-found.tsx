import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <p className="text-muted-foreground">Page not found!</p>
      <Button asChild className="mt-4">
        <Link href="/">Return Home</Link>
      </Button>
    </div>
  );
}
