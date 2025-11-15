import { Button } from "@/components/ui/button";

type ProposalsToolbarProps = {
  approvedCount: number;
  hasApprovedErrors: boolean;
  totalCount: number;
  isSaving: boolean;
  canSave: boolean;
  onSaveApproved: () => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClear: () => void;
};

export function ProposalsToolbar({
  approvedCount,
  hasApprovedErrors,
  totalCount,
  isSaving,
  canSave,
  onSaveApproved,
  onApproveAll,
  onRejectAll,
  onClear,
}: ProposalsToolbarProps) {
  const disableSave = !canSave || approvedCount === 0 || hasApprovedErrors || isSaving;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
        <span>Zaznaczone:</span>
        <strong>{approvedCount}</strong>
        <span className="text-neutral-500 dark:text-neutral-400">/ {totalCount}</span>
      </div>
      {hasApprovedErrors ? (
        <span className="text-sm font-medium text-red-600 dark:text-red-400">
          Popraw błędy w zatwierdzonych fiszkach przed zapisem.
        </span>
      ) : null}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onApproveAll} disabled={totalCount === 0 || isSaving}>
          Zaznacz wszystkie
        </Button>
        <Button variant="outline" onClick={onRejectAll} disabled={totalCount === 0 || isSaving}>
          Odznacz wszystkie
        </Button>
        <Button variant="ghost" onClick={onClear} disabled={totalCount === 0 || isSaving}>
          Wyczyść listę
        </Button>
        <Button onClick={onSaveApproved} disabled={disableSave}>
          {isSaving ? "Zapisywanie…" : "Zapisz zatwierdzone"}
        </Button>
      </div>
    </div>
  );
}
