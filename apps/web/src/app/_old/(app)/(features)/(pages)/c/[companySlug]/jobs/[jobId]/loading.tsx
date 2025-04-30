import TitleBar from '@acme/ui/components/title-bar';
import { LuLoaderCircle } from 'react-icons/lu';

export default function Loading() {
  return (
    <>
      <TitleBar title="Job" />
      <div className="flex h-48 items-center justify-center">
        <LuLoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    </>
  );
}
