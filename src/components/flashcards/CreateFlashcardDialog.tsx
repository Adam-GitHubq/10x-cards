import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { FlashcardDto } from "@/types";

import { useCreateFlashcard } from "./hooks";

type CreateFlashcardDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: FlashcardDto[]) => Promise<void> | void;
};

type FormState = {
  front: string;
  back: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const FRONT_LIMIT = 200;
const BACK_LIMIT = 500;

const INITIAL_FORM: FormState = {
  front: "",
  back: "",
};

export function CreateFlashcardDialog({ open, onOpenChange, onCreated }: CreateFlashcardDialogProps) {
  const { create, isCreating } = useCreateFlashcard();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm(INITIAL_FORM);
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

      const validationErrors = validate();
      setErrors(validationErrors);
      setSubmitError(null);

      if (Object.keys(validationErrors).length > 0) {
        return;
      }

      try {
        const payload = {
          cards: [
            {
              front: form.front.trim(),
              back: form.back.trim(),
              source: "manual" as const,
            },
          ],
        };

        const response = await create(payload);
        await onCreated(response.flashcards);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Nie udało się dodać fiszki.";
        setSubmitError(message);
        toast.error(message);
      }
    },
    [create, form.back, form.front, onCreated, validate]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dodaj ręczną fiszkę</DialogTitle>
          <DialogDescription>
            Uzupełnij treść fiszki. Zostanie ona przypisana jako manualna i pojawi się na pierwszej stronie listy.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="create-front">Przód</Label>
              <span className="text-xs text-muted-foreground">
                {frontLength}/{FRONT_LIMIT}
              </span>
            </div>
            <Textarea
              id="create-front"
              value={form.front}
              onChange={(event) => setForm((prev) => ({ ...prev, front: event.target.value }))}
              disabled={isCreating}
              aria-invalid={errors.front ? true : undefined}
              aria-describedby={errors.front ? "create-front-error" : undefined}
              placeholder="Pytanie, definicja lub hasło na przodzie fiszki..."
              rows={4}
            />
            {errors.front ? (
              <p id="create-front-error" className="text-xs text-destructive">
                {errors.front}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="create-back">Tył</Label>
              <span className="text-xs text-muted-foreground">
                {backLength}/{BACK_LIMIT}
              </span>
            </div>
            <Textarea
              id="create-back"
              value={form.back}
              onChange={(event) => setForm((prev) => ({ ...prev, back: event.target.value }))}
              disabled={isCreating}
              aria-invalid={errors.back ? true : undefined}
              aria-describedby={errors.back ? "create-back-error" : undefined}
              placeholder="Odpowiedź lub rozwinięcie na odwrocie fiszki..."
              rows={6}
            />
            {errors.back ? (
              <p id="create-back-error" className="text-xs text-destructive">
                {errors.back}
              </p>
            ) : null}
          </div>

          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isCreating}>
              Dodaj fiszkę
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
