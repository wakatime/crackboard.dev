import { Skeleton } from '@acme/ui/components/ui/skeleton';

export default function UserListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div>
      {new Array(count).fill(1).map((_, i) => (
        <div className="flex items-center gap-2 p-4" key={i}>
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
