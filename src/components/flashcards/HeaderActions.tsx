import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type HeaderActionsProps = {
  onAdd: () => void;
  busy?: boolean;
};

export function HeaderActions({ onAdd, busy }: HeaderActionsProps) {
  return (
    <div className="flex items-center justify-end">
      <Button type="button" onClick={onAdd} disabled={busy}>
        <Plus className="size-4" />
        Dodaj fiszkę
      </Button>
    </div>
  );
}
