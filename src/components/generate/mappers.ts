import type { CreateGenerationResponseDto, FlashcardProposalDto } from "@/types";

import type { GenerationResultViewModel, ProposalViewModel } from "./types";

const MAX_PROPOSALS = 30;

function generateProposalId(index: number) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `proposal-${Date.now()}-${index}`;
}

function mapProposalDto(dto: FlashcardProposalDto, index: number): ProposalViewModel {
  const front = dto.front.trim();
  const back = dto.back.trim();

  return {
    id: generateProposalId(index),
    front,
    back,
    source: dto.source,
    approved: false,
    errors: {},
    original: {
      front,
      back,
      source: dto.source,
    },
  };
}

export function mapGenerationResponseToViewModel(response: CreateGenerationResponseDto): GenerationResultViewModel {
  const totalProposals = response.flashcardsProposals.length;
  const proposals = response.flashcardsProposals.slice(0, MAX_PROPOSALS).map(mapProposalDto);

  return {
    generation: response.generation,
    proposals,
    totalProposals,
  };
}
