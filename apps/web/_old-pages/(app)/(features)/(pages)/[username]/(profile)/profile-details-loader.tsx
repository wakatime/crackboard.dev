import { Skeleton } from '@acme/ui/components/ui/skeleton';

export default function ProfileDetailsLoader() {
  return (
    <div className="grid gap-4 border-b p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-28 w-28 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="mt-4 space-y-2">
        <Skeleton className="h-5 w-[80%]" />
        <Skeleton className="h-5 w-[40%]" />
      </div>
    </div>
  );
}
