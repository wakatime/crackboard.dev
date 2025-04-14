'use client';

import { Button } from '@acme/ui/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@acme/ui/components/ui/tooltip';
import { useTheme } from 'next-themes';
import { LuMoon, LuSun } from 'react-icons/lu';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={(e) => {
            e.preventDefault();
            setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
          }}
          size="icon"
          variant="outline"
        >
          <LuSun className="dark:hidden" size={22} />
          <LuMoon className="hidden dark:block" size={22} />
          <span className="sr-only dark:hidden">Switch to dark mode</span>
          <span className="sr-only hidden dark:block">Switch to light mode</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <span className="dark:hidden">Switch to dark mode</span>
        <span className="hidden dark:block">Switch to light mode</span>
      </TooltipContent>
    </Tooltip>
  );
}
