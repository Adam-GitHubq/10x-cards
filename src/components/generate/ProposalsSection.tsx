import { ProposalTable } from "./ProposalTable";
import { ProposalsToolbar } from "./ProposalsToolbar";
import { SkeletonList } from "./SkeletonList";
import type { ProposalFieldEdit, ProposalViewModel, ViewPhase } from "./types";

type ProposalsSectionProps = {
  proposals: ProposalViewModel[];
  approvedCount: number;
  hasApprovedErrors: boolean;
  isSaving: boolean;
  canSave: boolean;
  phase: ViewPhase;
  truncatedBy?: number;
  onEdit: (payload: ProposalFieldEdit) => void;
  onToggleApprove: (id: string, approved: boolean) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onClear: () => void;
  onSaveApproved: () => void;
};

export function ProposalsSection({
  proposals,
  approvedCount,
  hasApprovedErrors,
  isSaving,
  canSave,
  phase,
  truncatedBy = 0,
  onEdit,
  onToggleApprove,
  onApproveAll,
  onRejectAll,
  onClear,
  onSaveApproved,
}: ProposalsSectionProps) {
  const isLoading = phase === "generating";

  return (
    <section className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Propozycje fiszek</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Edytuj treści, zatwierdź wybrane i zapisz do bazy.
          </p>
          {truncatedBy > 0 ? (
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Wyświetlamy maksymalnie 30 pozycji. Ukryto {truncatedBy} kolejnych propozycji z tej generacji.
            </p>
          ) : null}
        </div>
      </header>

      <ProposalsToolbar
        approvedCount={approvedCount}
        hasApprovedErrors={hasApprovedErrors}
        totalCount={proposals.length}
        isSaving={isSaving}
        canSave={canSave}
        onSaveApproved={onSaveApproved}
        onApproveAll={onApproveAll}
        onRejectAll={onRejectAll}
        onClear={onClear}
      />

      {isLoading ? (
        <SkeletonList rows={12} />
      ) : (
        <ProposalTable proposals={proposals} onEdit={onEdit} onToggleApprove={onToggleApprove} />
      )}
    </section>
  );
}
