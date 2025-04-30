import type { DialogProps } from '@acme/ui/components/ui/dialog';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from '@acme/ui/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@acme/ui/components/ui/tooltip';
import { cn } from '@acme/ui/lib/utils';
import type { ReactNode } from 'react';

type Props = {
  className?: string;
  description?: ReactNode;
  footer?: ReactNode;
  title?: ReactNode;
  tooltip?: ReactNode;
  trigger?: ReactNode;
} & DialogProps;

export const CustomDialog = ({
  title,
  description,
  footer,
  children,
  // eslint-disable-next-line @typescript-eslint/unbound-method
  onOpenChange,
  open,
  defaultOpen,
  modal,
  trigger,
  tooltip,
  className,
}: Props) => {
  return (
    <DialogRoot defaultOpen={defaultOpen} modal={modal} onOpenChange={onOpenChange} open={open}>
      {trigger ? (
        tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>{trigger}</DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        )
      ) : null}
      <DialogContent className={cn('gap-0 space-y-0 p-0', className)}>
        <DialogHeader className="p-6">
          {title ? <DialogTitle>{title}</DialogTitle> : null}
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="h-full w-full overflow-y-auto">{children}</div>
        {footer ? <DialogFooter className="p-6 pt-0">{footer}</DialogFooter> : null}
      </DialogContent>
    </DialogRoot>
  );
};
CustomDialog.displayName = 'CustomDialog';
