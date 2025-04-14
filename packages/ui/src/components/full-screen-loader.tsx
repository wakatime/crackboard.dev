import { BASE_URL } from '@acme/core/constants';
import Image from 'next/image';

import { cn } from '../lib/utils';

export default function FullScreenLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-1 items-center justify-center', className)}>
      <Image alt="wonderful.dev" height={98} src={`${BASE_URL}/logo.svg`} width={241} className="h-24 w-24 object-contain" />
    </div>
  );
}
