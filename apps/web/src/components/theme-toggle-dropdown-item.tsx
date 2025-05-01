import { DropdownMenuItem } from '@workspace/ui/components/dropdown-menu';
import { useTheme } from 'next-themes';
import { BsToggleOff, BsToggleOn } from 'react-icons/bs';
import { LuMoon } from 'react-icons/lu';

export default function ThemeToggleDropdownItem() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <DropdownMenuItem onClick={toggleTheme}>
      <BsToggleOff className="mr-2 dark:hidden" size={22} />
      <BsToggleOn className="mr-2 hidden dark:block" size={22} />
      Dark mode
      <LuMoon className="text-muted-foreground ml-1" size={18} />
    </DropdownMenuItem>
  );
}
