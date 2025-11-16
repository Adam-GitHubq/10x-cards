import { useId } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { useCharCounter } from "./hooks/useCharCounter";

type GenerationFormProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  errors?: string[];
};

export function GenerationForm({ value, onChange, onSubmit, isLoading, errors = [] }: GenerationFormProps) {
  const textAreaId = useId();
  const helpTextId = useId();
  const rangeErrorId = useId();
  const formErrorsId = useId();

  const { trimmedLength, isTooShort, isTooLong, isWithinRange, isEmpty, min, max } = useCharCounter(value);

  const showRangeError = !isEmpty && (isTooShort || isTooLong);
  const disableSubmit = isLoading || !isWithinRange;

  return (
    <form
      aria-describedby={errors.length > 0 ? formErrorsId : undefined}
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <label className="text-lg font-semibold text-neutral-900 dark:text-neutral-50" htmlFor={textAreaId}>
            Tekst źródłowy
          </label>
          <span
            className={cn(
              "text-sm font-medium",
              showRangeError ? "text-red-600 dark:text-red-400" : "text-neutral-500 dark:text-neutral-400"
            )}
            role="status"
            aria-live="polite"
          >{`${trimmedLength}/${max}`}</span>
        </div>
        <Textarea
          id={textAreaId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Wklej tutaj tekst do wygenerowania fiszek (1000–10000 znaków)…"
          aria-describedby={`${helpTextId}${showRangeError ? ` ${rangeErrorId}` : ""}`}
          aria-invalid={showRangeError}
          disabled={isLoading}
          data-testid="generate-source-text"
          className={cn(
            "resize-y",
            showRangeError ? "border-red-500 focus-visible:ring-red-600" : "border-neutral-300"
          )}
        />
        <p className="text-sm text-neutral-600 dark:text-neutral-400" id={helpTextId}>
          Tekst jest przycinany na potrzeby walidacji. Wymagane jest od {min} do {max} znaków. W tej wersji brak jest
          zapisu roboczego – odświeżenie strony spowoduje utratę zmian.
        </p>
        {showRangeError ? (
          <p className="text-sm font-medium text-red-600 dark:text-red-400" id={rangeErrorId}>
            Tekst po przycięciu zawiera {trimmedLength} znaków. Wymagany zakres to {min}–{max}.
          </p>
        ) : null}
      </div>
      {errors.length > 0 ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
          role="alert"
          id={formErrorsId}
        >
          <ul className="space-y-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="flex w-full justify-start">
        <Button type="submit" disabled={disableSubmit} data-testid="generate-submit-button">
          {isLoading ? "Generowanie…" : "Generuj"}
        </Button>
      </div>
    </form>
  );
}
