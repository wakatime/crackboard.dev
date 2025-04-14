'use client';

import { cn } from '@acme/ui/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import type { ReactNode } from 'react';
import { createContext, forwardRef, useContext } from 'react';

export interface StepperContextType {
  activeIndex: number;
  onActiveIndexChange?: (index: number) => void;
  totalSteps: number;
}
const StepperContext = createContext<StepperContextType>({ activeIndex: 0, totalSteps: 0 });

export type StepperProps = React.HTMLAttributes<HTMLDivElement> & StepperContextType;

const Stepper = forwardRef<HTMLDivElement, StepperProps>(({ className, activeIndex, onActiveIndexChange, totalSteps, ...props }, ref) => {
  return (
    <StepperContext.Provider value={{ activeIndex, onActiveIndexChange, totalSteps }}>
      <div {...props} className={cn(className)} ref={ref} />
    </StepperContext.Provider>
  );
});
Stepper.displayName = 'Stepper';

export type StepsListProps = React.HTMLAttributes<HTMLDivElement>;
const StepsList = forwardRef<HTMLDivElement, StepsListProps>(({ className, ...props }, ref) => {
  return (
    <div
      className={cn('my-4 flex flex-col gap-2 overflow-x-auto p-4 md:my-6 md:flex-row md:items-center md:gap-4 md:px-6', className)}
      ref={ref}
      {...props}
    />
  );
});
StepsList.displayName = 'StepsList';

export interface StepContextType {
  index: number;
}
const StepContext = createContext<StepContextType>({ index: 0 });

export type StepperItemProps = React.HTMLAttributes<HTMLDivElement> & StepContextType;
const Step = forwardRef<HTMLDivElement, StepperItemProps>(({ className, index, ...props }, ref) => {
  const { totalSteps } = useContext(StepperContext);
  return (
    <StepContext.Provider value={{ index }}>
      <div
        className={cn('flex flex-col gap-2 md:flex-row md:items-center', { 'flex-1': index < totalSteps - 1 }, className)}
        ref={ref}
        {...props}
      />
    </StepContext.Provider>
  );
});
Step.displayName = 'Step';

export type StepIndicatorProps = React.HTMLAttributes<HTMLDivElement>;
const StepIndicator = forwardRef<HTMLDivElement, StepIndicatorProps>(({ className, ...props }, ref) => {
  const { activeIndex } = useContext(StepperContext);
  const { index } = useContext(StepContext);
  const isActive = activeIndex === index;
  const isCompleted = index < activeIndex;

  return (
    <div
      className={cn(
        'border-muted bg-muted text-muted-foreground flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2',
        {
          'bg-primary text-primary-foreground': isActive || isCompleted,
        },
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
StepIndicator.displayName = 'StepIndicator';

export type StepStatusProps = React.HTMLAttributes<HTMLDivElement> & {
  active: ReactNode;
  complete: ReactNode;
  incomplete: ReactNode;
};
const StepStatus = forwardRef<HTMLDivElement, StepStatusProps>(({ className, complete, incomplete, active, ...props }, ref) => {
  const { activeIndex } = useContext(StepperContext);
  const { index } = useContext(StepContext);
  const isActive = activeIndex === index;
  const isCompleted = index < activeIndex;

  return (
    <div className={cn(className)} ref={ref} {...props}>
      {isCompleted ? complete : isActive ? active : incomplete}
    </div>
  );
});
StepStatus.displayName = 'StepStatus';

export type StepTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};
const StepTrigger = forwardRef<HTMLButtonElement, StepTriggerProps>(({ className, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(
        'ring-offset-background hover:bg-secondary/50 focus-visible:ring-ring flex items-center gap-4 rounded-lg p-2 pr-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
StepTrigger.displayName = 'StepTrigger';

export type StepTitleProps = React.HTMLAttributes<HTMLHeadingElement>;
const StepTitle = forwardRef<HTMLHeadingElement, StepTitleProps>(({ className, ...props }, ref) => {
  return <h3 className={cn('flex-1 truncate whitespace-nowrap font-medium', className)} ref={ref} {...props} />;
});
StepTitle.displayName = 'StepTitle';

export type StepDescriptionProps = React.HTMLAttributes<HTMLHeadingElement>;
const StepDescription = forwardRef<HTMLHeadingElement, StepDescriptionProps>(({ className, ...props }, ref) => {
  return <p className={cn('text-muted-foreground whitespace-nowrap text-sm', className)} ref={ref} {...props} />;
});
StepDescription.displayName = 'StepDescription';

export type StepSeperatorProps = React.HTMLAttributes<HTMLDivElement>;
const StepSeperator = forwardRef<HTMLDivElement, StepSeperatorProps>(({ className, ...props }, ref) => {
  const { activeIndex, totalSteps } = useContext(StepperContext);
  const { index } = useContext(StepContext);

  if (index === totalSteps - 1) {
    return null;
  }

  return (
    <div
      className={cn(
        'bg-border h-2 w-0.5 rounded-full max-md:ml-[26px] md:h-0.5 md:min-w-[24px] md:flex-1',
        {
          'bg-primary': index < activeIndex,
        },
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
StepSeperator.displayName = 'StepSeperator';

export {
  Step,
  StepContext,
  StepDescription,
  StepIndicator,
  Stepper,
  StepperContext,
  StepSeperator,
  StepsList,
  StepStatus,
  StepTitle,
  StepTrigger,
};
