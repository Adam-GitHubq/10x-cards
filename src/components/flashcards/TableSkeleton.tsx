import { Skeleton } from "@/components/ui/skeleton";

type TableSkeletonProps = {
  rows?: number;
};

export function TableSkeleton({ rows = 10 }: TableSkeletonProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <Skeleton className="mb-4 h-10 w-full" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
