import * as React from "react";

import { cn } from "@/lib/utils";

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className"> & {
  className?: string;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, disabled, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      disabled={disabled}
      className={cn(
        "h-4 w-4 rounded border border-neutral-300 text-neutral-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:focus-visible:ring-neutral-50",
        className
      )}
      {...props}
    />
  );
});
