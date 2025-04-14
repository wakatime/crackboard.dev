'use client';

import { Button } from '@acme/ui/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@acme/ui/components/ui/tooltip';
import { useIsMobile } from '@acme/ui/hooks/use-mobile';
import { LuMenu } from 'react-icons/lu';

import { useDrawer } from '~/providers/DrawerProvider';

export default function DrawerToggleButton() {
  const isMobile = useIsMobile(800);
  const { isDrawerOpen, setIsDrawerOpen } = useDrawer();

  if (!isMobile) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" className="[&_svg]:size-5" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
          <LuMenu />
          <p className="sr-only">Toggle Drawer</p>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Toggle Drawer</TooltipContent>
    </Tooltip>
  );
}
