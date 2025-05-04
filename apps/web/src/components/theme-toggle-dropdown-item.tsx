import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { Switch } from '@workspace/ui/components/switch';
import { useTheme } from 'next-themes';
import type { MouseEvent } from 'react';
import { useCallback } from 'react';

export default function ThemeToggleDropdownItem() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    },
    [resolvedTheme, setTheme],
  );

  return (
    <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
      Dark mode
      <Switch checked={resolvedTheme === 'dark'} className="pointer-events-none ml-2" />
    </DropdownMenuItem>
  );
}
