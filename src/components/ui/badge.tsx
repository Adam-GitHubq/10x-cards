import * as React from "react";

import { cn } from "@/lib/utils";

const baseClasses =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:focus-visible:ring-neutral-50";

const variants: Record<string, string> = {
  default: "border-transparent bg-neutral-900 text-neutral-50 dark:bg-neutral-50 dark:text-neutral-900",
  secondary: "border-transparent bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100",
  outline: "border-neutral-200 text-neutral-800 dark:border-neutral-700 dark:text-neutral-200",
};

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof variants;
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <div className={cn(baseClasses, variants[variant], className)} {...props} />;
}
