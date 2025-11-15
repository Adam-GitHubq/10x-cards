import { ArrowDown, ArrowUp, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { FlashcardRowVM } from "./types";
import { FlashcardsTableRow } from "./FlashcardsTableRow";

type FlashcardsTableProps = {
  items: FlashcardRowVM[];
  order: "asc" | "desc";
  onToggleOrder: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  busy?: boolean;
};

export function FlashcardsTable({ items, order, onToggleOrder, onEdit, onDelete, busy }: FlashcardsTableProps) {
  const OrderIcon = order === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="rounded-lg border border-border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead>Przód</TableHead>
            <TableHead>Tył</TableHead>
            <TableHead>Źródło</TableHead>
            <TableHead>ID generacji</TableHead>
            <TableHead>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onToggleOrder}
                disabled={busy}
                className="flex items-center gap-1"
              >
                <Clock className="size-4 opacity-70" />
                Data utworzenia
                <OrderIcon className="size-4 opacity-70" />
              </Button>
            </TableHead>
            <TableHead className="text-right">Akcje</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <FlashcardsTableRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} busy={busy} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
