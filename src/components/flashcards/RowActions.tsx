import { useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type RowActionsProps = {
  id: number;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  busy?: boolean;
};

export function RowActions({ id, onEdit, onDelete, busy }: RowActionsProps) {
  const handleEdit = useCallback(() => {
    onEdit(id);
  }, [id, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(id);
  }, [id, onDelete]);

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleEdit}
        disabled={busy}
        className="min-w-[84px]"
      >
        <Pencil className="size-4" />
        Edytuj
      </Button>
      <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={busy}>
        <Trash2 className="size-4" />
        Usuń
      </Button>
    </div>
  );
}


