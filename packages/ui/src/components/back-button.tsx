'use client';

import { Button } from '@workspace/ui/components/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@workspace/ui/components/tooltip';
import { usePreviousPath } from '@workspace/ui/hooks/use-previous-path';
import { useRouter } from 'next/navigation';
import { LuArrowLeft } from 'react-icons/lu';

export default function BackButton({ homeHref = '/', useHistory = true }: { homeHref?: string; useHistory?: boolean }) {
  const previousPath = usePreviousPath();
  const router = useRouter();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            if (previousPath && useHistory) {
              router.back();
            } else {
              router.push(homeHref);
            }
          }}
          className="[&_svg]:size-5"
        >
          <LuArrowLeft />
          <p className="sr-only">Back</p>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Back</TooltipContent>
    </Tooltip>
  );
}
