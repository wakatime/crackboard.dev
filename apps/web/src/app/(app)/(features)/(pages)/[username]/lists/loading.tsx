import TitleBar from '@acme/ui/components/title-bar';
import { Skeleton } from '@acme/ui/components/ui/skeleton';
import { LuLoaderCircle } from 'react-icons/lu';

export default function Loading() {
  return (
    <>
      <TitleBar
        hideBackButton
        title={
          <div>
            <p className="line-clamp-1 text-lg leading-6 font-bold">Lists</p>
            <Skeleton className="h-4 w-20" />
          </div>
        }
      />
      <div className="flex h-40 items-center justify-center">
        <LuLoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    </>
  );
}
