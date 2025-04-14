'use client';

import { cn } from '@acme/ui/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
};
const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'div';
  return <Comp className={cn('bg-card text-card-foreground rounded-lg border shadow-sm', className)} ref={ref} {...props} />;
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div className={cn('flex flex-col space-y-1.5 p-4', className)} ref={ref} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 className={cn('text-xl font-semibold leading-none tracking-tight', className)} ref={ref} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p className={cn('text-muted-foreground text-sm', className)} ref={ref} {...props} />,
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div className={cn('p-4 pt-0', className)} ref={ref} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div className={cn('flex items-center p-4 pt-0', className)} ref={ref} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardContent,CardDescription, CardFooter, CardHeader, CardTitle };
