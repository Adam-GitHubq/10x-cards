import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  onAdd: () => void;
};

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-12 py-16 text-center">
      <div className="rounded-full border border-border bg-background p-4 text-muted-foreground shadow-sm">
        <Inbox className="size-8" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">Brak fiszek</h3>
        <p className="max-w-md text-sm text-muted-foreground">
          Nie znaleziono fiszek dla wybranych filtrów. Spróbuj zresetować filtrację lub dodaj pierwszą fiszkę ręcznie.
        </p>
      </div>
      <Button type="button" onClick={onAdd}>
        Dodaj pierwszą fiszkę
      </Button>
    </div>
  );
}



