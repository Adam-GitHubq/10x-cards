import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type { ProposalFieldEdit, ProposalViewModel } from "./types";
import { ProposalRow } from "./ProposalRow";

type ProposalTableProps = {
  proposals: ProposalViewModel[];
  onEdit: (payload: ProposalFieldEdit) => void;
  onToggleApprove: (id: string, approved: boolean) => void;
};

export function ProposalTable({ proposals, onEdit, onToggleApprove }: ProposalTableProps) {
  if (proposals.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
        Brak propozycji do wyświetlenia. Wygeneruj fiszki, aby rozpocząć.
      </div>
    );
  }

  return (
    <div className="max-h-[640px] overflow-y-auto rounded-lg border border-neutral-200 shadow-sm dark:border-neutral-800">
      <Table className="min-w-[960px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] text-center">Zatwierdź</TableHead>
            <TableHead className="w-[30%]">Przód</TableHead>
            <TableHead className="w-[40%]">Tył</TableHead>
            <TableHead className="w-[120px]">Źródło</TableHead>
            <TableHead className="w-[160px]">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.map((proposal) => (
            <ProposalRow key={proposal.id} proposal={proposal} onEdit={onEdit} onToggleApprove={onToggleApprove} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
