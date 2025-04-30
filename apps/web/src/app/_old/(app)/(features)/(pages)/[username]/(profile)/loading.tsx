import { Skeleton } from '@acme/ui/components/ui/skeleton';

import ProfileDetailsLoader from './profile-details-loader';

export default function Loading() {
  return (
    <>
      <div className="flex h-14 items-center border-b px-4">
        <div>
          <Skeleton className="h-5 w-16" />
          <Skeleton className="mt-1.5 h-3 w-24" />
        </div>
      </div>

      <ProfileDetailsLoader />
    </>
  );
}
