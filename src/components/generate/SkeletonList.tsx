import { Skeleton } from "@/components/ui/skeleton";

type SkeletonListProps = {
  rows?: number;
};

export function SkeletonList({ rows = 10 }: SkeletonListProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-64 flex-1" />
          <Skeleton className="h-4 w-48 flex-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
