'use client';

import { Card, CardFooter, CardHeader, CardTitle } from '@acme/ui/components/ui/card';
import { Switch } from '@acme/ui/components/ui/switch';
import { useTheme } from 'next-themes';

export default function ToggleThemeCard() {
  const { setTheme, resolvedTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color theme</CardTitle>
      </CardHeader>
      <CardFooter>
        <Switch autoCorrect="off" checked={resolvedTheme === 'dark'} onCheckedChange={toggleTheme} className="mr-3" />
        Dark mode
      </CardFooter>
    </Card>
  );
}
