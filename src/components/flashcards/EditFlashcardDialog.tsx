import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardDto } from "@/types";

import { useUpdateFlashcard } from "./hooks";

type EditFlashcardDialogProps = {
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: FlashcardDto | null;
  onUpdated: (updated: FlashcardDto) => Promise<void> | void;
  isPrefetching?: boolean;
};

type FormState = {
  front: string;
  back: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const FRONT_LIMIT = 200;
const BACK_LIMIT = 500;

const EMPTY_FORM: FormState = {
  front: "",
  back: "",
};

export function EditFlashcardDialog({
  id,
  open,
  onOpenChange,
  initial,
  onUpdated,
  isPrefetching,
}: EditFlashcardDialogProps) {
  const { update, isUpdating } = useUpdateFlashcard();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) {
      setForm({ front: initial.front, back: initial.back });
      setErrors({});
      setSubmitError(null);
    }
  }, [initial]);

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitError(null);
    }
  }, [open]);

  const frontLength = useMemo(() => form.front.trim().length, [form.front]);
  const backLength = useMemo(() => form.back.trim().length, [form.back]);

  const validate = useCallback((): FormErrors => {
    const nextErrors: FormErrors = {};
    const trimmedFront = form.front.trim();
    const trimmedBack = form.back.trim();

    if (trimmedFront.length === 0) {
      nextErrors.front = "Przód fiszki nie może być pusty.";
    } else if (trimmedFront.length > FRONT_LIMIT) {
      nextErrors.front = `Przód może zawierać maksymalnie ${FRONT_LIMIT} znaków.`;
    }

    if (trimmedBack.length === 0) {
      nextErrors.back = "Tył fiszki nie może być pusty.";
    } else if (trimmedBack.length > BACK_LIMIT) {
      nextErrors.back = `Tył może zawierać maksymalnie ${BACK_LIMIT} znaków.`;
    }

    return nextErrors;
  }, [form.back, form.front]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!id) {
        toast.error("Brak identyfikatora fiszki. Zamknij i spróbuj ponownie.");
        return;
      }

      const validationErrors = validate();
      setErrors(validationErrors);
      setSubmitError(null);

      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      try {
        const response = await update(id, {
          front: form.front.trim(),
          back: form.back.trim(),
        });

        const baseSource = initial?.source;
        const next: FlashcardDto =
          baseSource && baseSource !== "manual" ? { ...response, source: "ai-edited" } : response;

        await onUpdated(next);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Nie udało się zaktualizować fiszki. Spróbuj ponownie później.";
        setSubmitError(message);
        toast.error(message);
      }
    },
    [form.back, form.front, id, initial, onUpdated, update, validate]
  );

  const isLoading = isPrefetching || (open && !initial);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>Wprowadź poprawki i zapisz zmiany, aby zaktualizować treść fiszki.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-front">Przód</Label>
                <span className="text-xs text-muted-foreground">
                  {frontLength}/{FRONT_LIMIT}
                </span>
              </div>
              <Textarea
                id="edit-front"
                value={form.front}
                onChange={(event) => setForm((prev) => ({ ...prev, front: event.target.value }))}
                disabled={isUpdating}
                aria-invalid={errors.front ? true : undefined}
                aria-describedby={errors.front ? "edit-front-error" : undefined}
                rows={4}
              />
              {errors.front ? (
                <p id="edit-front-error" className="text-xs text-destructive">
                  {errors.front}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-back">Tył</Label>
                <span className="text-xs text-muted-foreground">
                  {backLength}/{BACK_LIMIT}
                </span>
              </div>
              <Textarea
                id="edit-back"
                value={form.back}
                onChange={(event) => setForm((prev) => ({ ...prev, back: event.target.value }))}
                disabled={isUpdating}
                aria-invalid={errors.back ? true : undefined}
                aria-describedby={errors.back ? "edit-back-error" : undefined}
                rows={6}
              />
              {errors.back ? (
                <p id="edit-back-error" className="text-xs text-destructive">
                  {errors.back}
                </p>
              ) : null}
            </div>

            {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
                Anuluj
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Zapisuję
                  </>
                ) : (
                  "Zapisz zmiany"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}



