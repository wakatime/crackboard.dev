'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';

export default function ThemeProvider({ children, ...props }: React.ComponentProps<typeof NextThemeProvider>) {
  return <NextThemeProvider {...props}>{children}</NextThemeProvider>;
}
