import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

import { useDeleteFlashcard } from "./hooks";

type DeleteFlashcardAlertProps = {
  id: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: number) => Promise<void> | void;
};

export function DeleteFlashcardAlert({ id, open, onOpenChange, onDeleted }: DeleteFlashcardAlertProps) {
  const { remove, isDeleting } = useDeleteFlashcard();
  const [currentId, setCurrentId] = useState<number | null>(id);

  useEffect(() => {
    setCurrentId(id);
  }, [id]);

  const handleConfirm = useCallback(async () => {
    if (!currentId) {
      toast.error("Brak identyfikatora fiszki do usunięcia.");
      return;
    }

    try {
      await remove(currentId);
      await onDeleted(currentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nie udało się usunąć fiszki.";
      toast.error(message);
    }
  }, [currentId, onDeleted, remove]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Usuń fiszkę?</AlertDialogTitle>
          <AlertDialogDescription>
            Tej operacji nie można cofnąć. Usunięta fiszka zniknie z listy oraz historii generacji.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anuluj</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isDeleting}>
            Usuń fiszkę
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
