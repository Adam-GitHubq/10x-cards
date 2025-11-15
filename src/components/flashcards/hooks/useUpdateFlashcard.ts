import { useCallback, useState } from "react";

import {
  ensureApiError,
  type ApiError,
  updateFlashcard,
} from "@/lib/api/flashcards";
import type { FlashcardDto, UpdateFlashcardCommand } from "@/types";

type UseUpdateFlashcardResult = {
  isUpdating: boolean;
  update: (id: number, payload: UpdateFlashcardCommand) => Promise<FlashcardDto>;
  error: ApiError | null;
  resetError: () => void;
};

export function useUpdateFlashcard(): UseUpdateFlashcardResult {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const update = useCallback(async (id: number, payload: UpdateFlashcardCommand) => {
    setIsUpdating(true);
    setError(null);

    try {
      return await updateFlashcard(id, payload);
    } catch (cause) {
      const apiError = ensureApiError(cause);
      setError(apiError);
      throw apiError;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isUpdating,
    update,
    error,
    resetError,
  };
}


