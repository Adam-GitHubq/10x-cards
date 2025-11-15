import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  busy?: boolean;
};

export function Pagination({ page, pageSize, total, onPageChange, busy }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize || 1));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const pageRange = useMemo(() => {
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);

    if (total === 0) {
      return "Brak wyników";
    }

    return `Wyświetlanie ${start}–${end} z ${total}`;
  }, [page, pageSize, total]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
      <span>{pageRange}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev || busy}
        >
          <ChevronLeft className="size-4" />
          Poprzednia
        </Button>
        <span className="text-sm text-foreground">
          Strona {page} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext || busy}
        >
          Następna
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
