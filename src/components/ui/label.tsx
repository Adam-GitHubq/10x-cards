import * as React from "react";
import { Label as RadixLabel, type LabelProps as RadixLabelProps } from "@radix-ui/react-label";

import { cn } from "@/lib/utils";

export type LabelProps = RadixLabelProps;

export const Label = React.forwardRef<React.ElementRef<typeof RadixLabel>, LabelProps>(function Label(
  { className, ...props },
  ref
) {
  return (
    <RadixLabel
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
});


