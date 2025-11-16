import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Filter, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FlashcardSource } from "@/types";

import type { FlashcardsFiltersVM } from "./types";

type FiltersBarProps = {
  value: FlashcardsFiltersVM;
  onChange: (next: FlashcardsFiltersVM) => void;
  onReset: () => void;
  busy?: boolean;
};

type SourceOption = FlashcardSource | typeof ALL_SOURCES_OPTION;

type FiltersFormState = {
  source: SourceOption;
  generationId: string;
  order: "asc" | "desc";
};

const ALL_SOURCES_OPTION = "all";

const SOURCE_OPTIONS: { value: FlashcardSource; label: string }[] = [
  { value: "manual", label: "Manualne" },
  { value: "ai-full", label: "AI" },
  { value: "ai-edited", label: "AI (edytowane)" },
];

const DEBOUNCE_DELAY = 1500;

function toFormState(filters: FlashcardsFiltersVM): FiltersFormState {
  return {
    source: filters.source ?? ALL_SOURCES_OPTION,
    generationId: typeof filters.generationId === "number" ? String(filters.generationId) : "",
    order: filters.order,
  };
}

function isFormEqual(a: FiltersFormState, b: FiltersFormState) {
  return a.source === b.source && a.generationId === b.generationId && a.order === b.order;
}

function normalizeForm(form: FiltersFormState, base: FlashcardsFiltersVM): FlashcardsFiltersVM {
  const source = form.source === ALL_SOURCES_OPTION ? undefined : (form.source as FlashcardSource);
  const generationId = form.generationId.trim() === "" ? undefined : Number(form.generationId);

  return {
    ...base,
    page: 1,
    source,
    generationId: Number.isInteger(generationId) && (generationId as number) > 0 ? generationId : undefined,
    order: form.order,
  };
}

// Wydzielony komponent dla inputa ID generacji, żeby uniknąć utraty focusa
const GenerationIdInput = memo(
  ({
    value,
    onChange,
    disabled,
    inputRef,
  }: {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    inputRef?: React.RefObject<HTMLInputElement>;
  }) => {
    return (
      <div className="space-y-2">
        <Label htmlFor="flashcards-generation">ID generacji</Label>
        <Input
          ref={inputRef}
          id="flashcards-generation"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="np. 42"
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Nie re-renderuj jeśli tylko disabled się zmienił, ale wartość i handler są takie same
    // To zapobiega utracie focusa gdy zmienia się stan busy
    return (
      prevProps.value === nextProps.value &&
      prevProps.onChange === nextProps.onChange &&
      prevProps.inputRef === nextProps.inputRef
    );
  }
);

GenerationIdInput.displayName = "GenerationIdInput";

export function FiltersBar({ value, onChange, onReset, busy }: FiltersBarProps) {
  const [formState, setFormState] = useState<FiltersFormState>(() => toFormState(value));
  const debounceRef = useRef<number | null>(null);
  const isTypingRef = useRef<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldRestoreFocusRef = useRef<boolean>(false);

  // Przywróć focus po re-renderze jeśli był aktywny
  useEffect(() => {
    if (shouldRestoreFocusRef.current && inputRef.current && !inputRef.current.disabled) {
      inputRef.current.focus();
      shouldRestoreFocusRef.current = false;
    }
  });

  useEffect(() => {
    // Nie aktualizuj formState jeśli użytkownik aktywnie wpisuje dane
    if (isTypingRef.current) {
      return;
    }

    const next = toFormState(value);

    if (!isFormEqual(next, formState)) {
      // Zapamiętaj czy input miał focus przed aktualizacją
      if (document.activeElement === inputRef.current) {
        shouldRestoreFocusRef.current = true;
      }
      setFormState(next);
    }
  }, [value, formState]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const emitChange = useCallback(
    (nextForm: FiltersFormState, immediate = false) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      const trigger = () => {
        isTypingRef.current = false;
        onChange(normalizeForm(nextForm, value));
      };

      if (immediate) {
        trigger();
      } else {
        isTypingRef.current = true;
        debounceRef.current = window.setTimeout(trigger, DEBOUNCE_DELAY);
      }
    },
    [onChange, value]
  );

  const handleSourceChange = useCallback(
    (nextSource: SourceOption) => {
      setFormState((prev) => {
        const next = { ...prev, source: nextSource };
        emitChange(next);
        return next;
      });
    },
    [emitChange]
  );

  const handleGenerationChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const sanitized = raw.replace(/[^\d]/g, "");

      setFormState((prev) => {
        const next = { ...prev, generationId: sanitized };
        emitChange(next);
        return next;
      });
    },
    [emitChange]
  );

  const handleOrderChange = useCallback(
    (nextOrder: "asc" | "desc") => {
      setFormState((prev) => {
        const next = { ...prev, order: nextOrder };
        emitChange(next, true);
        return next;
      });
    },
    [emitChange]
  );

  const handleReset = useCallback(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    isTypingRef.current = false;
    onReset();
  }, [onReset]);

  return (
    <div className="rounded-lg border border-border bg-background p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Filter className="size-4" />
        Filtrowanie i sortowanie
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,240px)_minmax(0,200px)_minmax(0,220px)_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="flashcards-source">Źródło</Label>
          <Select
            value={formState.source}
            onValueChange={(value) => handleSourceChange(value as SourceOption)}
            disabled={busy}
          >
            <SelectTrigger id="flashcards-source">
              <SelectValue placeholder="Wszystkie źródła" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_SOURCES_OPTION}>Wszystkie</SelectItem>
              {SOURCE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <GenerationIdInput
          value={formState.generationId}
          onChange={handleGenerationChange}
          disabled={busy}
          inputRef={inputRef}
        />

        <div className="space-y-2">
          <Label htmlFor="flashcards-order">Kolejność</Label>
          <Select
            value={formState.order}
            onValueChange={(value) => handleOrderChange(value as "asc" | "desc")}
            disabled={busy}
          >
            <SelectTrigger id="flashcards-order">
              <SelectValue placeholder="Najnowsze najpierw" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Najnowsze najpierw</SelectItem>
              <SelectItem value="asc">Najstarsze najpierw</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end">
          <Button type="button" variant="outline" size="sm" onClick={handleReset} disabled={busy}>
            <RotateCcw className="size-4" />
            Wyczyść
          </Button>
        </div>
      </div>
    </div>
  );
}
