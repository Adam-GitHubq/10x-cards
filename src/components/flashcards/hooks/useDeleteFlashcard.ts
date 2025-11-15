import { useCallback, useState } from "react";

import { deleteFlashcard, ensureApiError, type ApiError } from "@/lib/api/flashcards";

type UseDeleteFlashcardResult = {
  isDeleting: boolean;
  remove: (id: number) => Promise<void>;
  error: ApiError | null;
  resetError: () => void;
};

export function useDeleteFlashcard(): UseDeleteFlashcardResult {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const remove = useCallback(async (id: number) => {
    setIsDeleting(true);
    setError(null);

    try {
      await deleteFlashcard(id);
    } catch (cause) {
      const apiError = ensureApiError(cause);
      setError(apiError);
      throw apiError;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isDeleting,
    remove,
    error,
    resetError,
  };
}
