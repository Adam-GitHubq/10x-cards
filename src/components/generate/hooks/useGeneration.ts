import { useCallback, useState } from "react";

import type { CreateGenerationCommand, CreateGenerationResponseDto } from "@/types";
import { HttpError, postJson } from "@/lib/http";

type UseGenerationResult = {
  trigger: (sourceText: string) => Promise<CreateGenerationResponseDto>;
  isLoading: boolean;
  error: HttpError | null;
  reset: () => void;
};

export function useGeneration(): UseGenerationResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<HttpError | null>(null);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  const trigger = useCallback(async (sourceText: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload: CreateGenerationCommand = {
        sourceText,
      };

      const response = await postJson<CreateGenerationCommand, CreateGenerationResponseDto>(
        "/api/generations",
        payload
      );

      return response;
    } catch (unknownError) {
      if (unknownError instanceof HttpError) {
        setError(unknownError);
        throw unknownError;
      }

      const fallbackError = new HttpError(500, null, "Wystąpił nieoczekiwany błąd.");
      setError(fallbackError);
      throw fallbackError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    trigger,
    isLoading,
    error,
    reset,
  };
}
