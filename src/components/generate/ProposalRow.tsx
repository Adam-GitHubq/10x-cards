import { useId } from "react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";

import type { ProposalFieldEdit, ProposalViewModel } from "./types";

type ProposalRowProps = {
  proposal: ProposalViewModel;
  onToggleApprove: (id: string, approved: boolean) => void;
  onEdit: (payload: ProposalFieldEdit) => void;
};

function mapSourceLabel(source: ProposalViewModel["source"]) {
  switch (source) {
    case "ai-full":
      return "AI – pełna";
    case "ai-edited":
      return "AI – edytowana";
    case "manual":
      return "Manualna";
    default:
      return source;
  }
}

export function ProposalRow({ proposal, onToggleApprove, onEdit }: ProposalRowProps) {
  const frontId = useId();
  const backId = useId();

  const frontError = proposal.errors.front;
  const backError = proposal.errors.back;

  return (
    <TableRow data-invalid={proposal.approved && (frontError || backError) ? "true" : undefined}>
      <TableCell className="align-middle">
        <div className="flex justify-center">
          <Checkbox
            checked={proposal.approved}
            onChange={(event) => onToggleApprove(proposal.id, event.target.checked)}
            aria-describedby={
              proposal.approved && (frontError || backError) ? `${frontId}-error ${backId}-error` : undefined
            }
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <label className="sr-only" htmlFor={frontId}>
            Przód fiszki
          </label>
          <textarea
            id={frontId}
            className="min-h-[64px] w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50 dark:focus-visible:ring-neutral-50"
            value={proposal.front}
            onChange={(event) =>
              onEdit({
                id: proposal.id,
                field: "front",
                value: event.currentTarget.value,
              })
            }
            aria-invalid={Boolean(frontError)}
            aria-describedby={frontError ? `${frontId}-error` : undefined}
          />
          {frontError ? (
            <p className="text-xs font-medium text-red-600 dark:text-red-400" id={`${frontId}-error`}>
              {frontError}
            </p>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <label className="sr-only" htmlFor={backId}>
            Tył fiszki
          </label>
          <textarea
            id={backId}
            className="min-h-[96px] w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50 dark:focus-visible:ring-neutral-50"
            value={proposal.back}
            onChange={(event) =>
              onEdit({
                id: proposal.id,
                field: "back",
                value: event.currentTarget.value,
              })
            }
            aria-invalid={Boolean(backError)}
            aria-describedby={backError ? `${backId}-error` : undefined}
          />
          {backError ? (
            <p className="text-xs font-medium text-red-600 dark:text-red-400" id={`${backId}-error`}>
              {backError}
            </p>
          ) : null}
        </div>
      </TableCell>
      <TableCell className="align-middle">
        <Badge variant={proposal.source === "ai-edited" ? "secondary" : "outline"}>
          {mapSourceLabel(proposal.source)}
        </Badge>
      </TableCell>
      <TableCell className="align-middle text-sm">
        {proposal.approved ? (
          frontError || backError ? (
            <span className="font-medium text-red-600 dark:text-red-400">Błąd w zatwierdzonej fiszce</span>
          ) : (
            <span className="text-neutral-500 dark:text-neutral-400">Gotowa do zapisu</span>
          )
        ) : (
          <span className="text-neutral-400 dark:text-neutral-500">Niezatwierdzona</span>
        )}
      </TableCell>
    </TableRow>
  );
}
