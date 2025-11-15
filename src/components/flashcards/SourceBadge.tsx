import { Badge } from "@/components/ui/badge";
import type { FlashcardSource } from "@/types";

type SourceBadgeProps = {
  source: FlashcardSource;
};

const SOURCE_LABELS: Record<FlashcardSource, string> = {
  manual: "Manualna",
  "ai-full": "AI",
  "ai-edited": "AI (edytowana)",
};

const SOURCE_CLASSNAMES: Record<FlashcardSource, string> = {
  manual: "border-neutral-200 bg-neutral-100 text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
  "ai-full": "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  "ai-edited":
    "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
};

export function SourceBadge({ source }: SourceBadgeProps) {
  return (
    <Badge className={SOURCE_CLASSNAMES[source]} aria-label={`Źródło: ${SOURCE_LABELS[source]}`}>
      {SOURCE_LABELS[source]}
    </Badge>
  );
}


