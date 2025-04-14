'use client';

import { cn } from '@acme/ui/lib/utils';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import * as React from 'react';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & { size?: 'sm' | 'md' }
>(({ className, size, ...props }, ref) => {
  size = size ?? 'md';
  return (
    <SwitchPrimitives.Root
      className={cn(
        'focus-visible:ring-ring focus-visible:ring-offset-background data-[state=checked]:bg-primary data-[state=unchecked]:bg-input peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
        {
          'h-4 w-7': size === 'sm',
          'h-6 w-11': size === 'md',
        },
      )}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          'bg-background pointer-events-none block rounded-full shadow-lg ring-0 transition-transform data-[state=unchecked]:translate-x-0',
          {
            'h-3 w-3 data-[state=checked]:translate-x-3': size === 'sm',
            'h-5 w-5 data-[state=checked]:translate-x-5': size === 'md',
          },
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
