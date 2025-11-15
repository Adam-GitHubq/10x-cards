import { Badge } from "@/components/ui/badge";
import type { GenerationBaseDto } from "@/types";

type GenerationSummaryBarProps = {
  generation: GenerationBaseDto;
};

function formatDuration(milliseconds: number) {
  if (milliseconds < 1000) {
    return `${milliseconds} ms`;
  }

  const seconds = milliseconds / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(1)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const restSeconds = Math.round(seconds % 60);
  return `${minutes} min ${restSeconds} s`;
}

export function GenerationSummaryBar({ generation }: GenerationSummaryBarProps) {
  const createdAtLabel = new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(generation.createdAt));

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-center gap-2">
        <span className="text-neutral-500 dark:text-neutral-400">Model</span>
        <Badge>{generation.model}</Badge>
      </div>
      <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
        <span className="text-neutral-500 dark:text-neutral-400">Propozycji</span>
        <strong>{generation.generatedCount}</strong>
      </div>
      <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
        <span className="text-neutral-500 dark:text-neutral-400">Czas</span>
        <strong>{formatDuration(generation.generationDuration)}</strong>
      </div>
      <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-200">
        <span className="text-neutral-500 dark:text-neutral-400">Utworzono</span>
        <strong>{createdAtLabel}</strong>
      </div>
      <div className="flex items-center gap-2 truncate text-neutral-700 dark:text-neutral-200">
        <span className="text-neutral-500 dark:text-neutral-400">Hash</span>
        <code className="rounded bg-neutral-200 px-2 py-1 text-xs font-mono dark:bg-neutral-800">
          {generation.sourceTextHash.slice(0, 10)}
        </code>
      </div>
    </div>
  );
}
