import { useCallback, useState } from "react";

import {
  createFlashcards,
  ensureApiError,
  type ApiError,
} from "@/lib/api/flashcards";
import type {
  CreateFlashcardsCommand,
  CreateFlashcardsResponseDto,
} from "@/types";

type UseCreateFlashcardResult = {
  isCreating: boolean;
  create: (payload: CreateFlashcardsCommand) => Promise<CreateFlashcardsResponseDto>;
  resetError: () => void;
  error: ApiError | null;
};

export function useCreateFlashcard(): UseCreateFlashcardResult {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const create = useCallback(async (payload: CreateFlashcardsCommand) => {
    setIsCreating(true);
    setError(null);

    try {
      return await createFlashcards(payload);
    } catch (cause) {
      const apiError = ensureApiError(cause);
      setError(apiError);
      throw apiError;
    } finally {
      setIsCreating(false);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isCreating,
    create,
    resetError,
    error,
  };
}


