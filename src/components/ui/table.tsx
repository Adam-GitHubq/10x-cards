import * as React from "react";

import { cn } from "@/lib/utils";

const TableRoot = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-x-auto">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm text-neutral-800 dark:text-neutral-100", className)}
        {...props}
      />
    </div>
  )
);

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn("sticky top-0 bg-white text-xs uppercase tracking-wide dark:bg-neutral-950", className)}
      {...props}
    />
  )
);

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("divide-y divide-neutral-100 dark:divide-neutral-800", className)} {...props} />
  )
);

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "transition hover:bg-neutral-50 data-[invalid=true]:bg-red-50 dark:hover:bg-neutral-900 dark:data-[invalid=true]:bg-red-950/40",
        className
      )}
      {...props}
    />
  )
);

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "px-4 py-3 text-left font-medium text-neutral-500 dark:text-neutral-400 first:pl-6 last:pr-6",
        className
      )}
      {...props}
    />
  )
);

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("px-4 py-4 align-top text-neutral-900 dark:text-neutral-100 first:pl-6 last:pr-6", className)}
      {...props}
    />
  )
);

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-neutral-500 dark:text-neutral-400", className)} {...props} />
  )
);

export { TableRoot as Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow };
