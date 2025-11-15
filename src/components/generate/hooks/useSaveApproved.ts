import { useCallback, useState } from "react";

import type { CreateFlashcardsCommand, CreateFlashcardsResponseDto, FlashcardSource } from "@/types";
import { HttpError, postJson } from "@/lib/http";

import type { ProposalViewModel } from "../types";

type TriggerPayload = {
  generationId?: number;
  proposals: ProposalViewModel[];
};

type UseSaveApprovedResult = {
  trigger: (payload: TriggerPayload) => Promise<CreateFlashcardsResponseDto>;
  isSaving: boolean;
  error: HttpError | null;
  reset: () => void;
};

type CreateFlashcardItem = {
  front: string;
  back: string;
  source: FlashcardSource;
  generationId?: number;
};

function buildCardPayload(proposal: ProposalViewModel, generationId?: number): CreateFlashcardItem {
  return {
    front: proposal.front.trim(),
    back: proposal.back.trim(),
    source: proposal.source,
    generationId,
  };
}

export function useSaveApproved(): UseSaveApprovedResult {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<HttpError | null>(null);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  const trigger = useCallback(async ({ generationId, proposals }: TriggerPayload) => {
    setIsSaving(true);
    setError(null);

    try {
      const approved = proposals.filter(
        (proposal) => proposal.approved && !proposal.errors.front && !proposal.errors.back
      );

      const cards = approved.map((proposal) => buildCardPayload(proposal, generationId));

      const payload: CreateFlashcardsCommand = {
        cards,
      };

      const response = await postJson<CreateFlashcardsCommand, CreateFlashcardsResponseDto>("/api/flashcards", payload);

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
      setIsSaving(false);
    }
  }, []);

  return {
    trigger,
    isSaving,
    error,
    reset,
  };
}
