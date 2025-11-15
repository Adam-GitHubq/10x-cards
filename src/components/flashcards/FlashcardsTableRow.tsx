import { memo, useMemo } from "react";

import { TableCell, TableRow } from "@/components/ui/table";

import type { FlashcardRowVM } from "./types";
import { RowActions } from "./RowActions";
import { SourceBadge } from "./SourceBadge";

type FlashcardsTableRowProps = {
  item: FlashcardRowVM;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  busy?: boolean;
};

const MAX_TEXT_PREVIEW = 140;

function truncate(value: string) {
  if (value.length <= MAX_TEXT_PREVIEW) {
    return value;
  }

  return `${value.slice(0, MAX_TEXT_PREVIEW - 1)}…`;
}

export const FlashcardsTableRow = memo(function FlashcardsTableRow({
  item,
  onEdit,
  onDelete,
  busy,
}: FlashcardsTableRowProps) {
  const frontPreview = useMemo(() => truncate(item.front), [item.front]);
  const backPreview = useMemo(() => truncate(item.back), [item.back]);

  return (
    <TableRow>
      <TableCell className="w-[28%]">
        <p className="text-sm font-medium text-foreground">{frontPreview}</p>
      </TableCell>
      <TableCell className="w-[34%]">
        <p className="text-sm text-muted-foreground">{backPreview}</p>
      </TableCell>
      <TableCell className="w-[12%]">
        <SourceBadge source={item.source} />
      </TableCell>
      <TableCell className="w-[8%] text-sm text-muted-foreground">
        {item.generationId === null ? "—" : `#${item.generationId}`}
      </TableCell>
      <TableCell className="w-[10%] text-sm font-medium text-muted-foreground">{item.createdAtLabel}</TableCell>
      <TableCell className="w-[8%] text-right">
        <RowActions id={item.id} onEdit={onEdit} onDelete={onDelete} busy={busy} />
      </TableCell>
    </TableRow>
  );
});
