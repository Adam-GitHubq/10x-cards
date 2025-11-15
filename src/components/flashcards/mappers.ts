import type { FlashcardDto, ListFlashcardsResponseDto } from "@/types";

import type { FlashcardRowVM, FlashcardsListVM } from "./types";

export function mapFlashcardDtoToRow(dto: FlashcardDto): FlashcardRowVM {
  return {
    id: dto.id,
    front: dto.front,
    back: dto.back,
    source: dto.source,
    generationId: dto.generationId,
    createdAtISO: dto.createdAt,
    updatedAtISO: dto.updatedAt,
    createdAtLabel: formatDateLabel(dto.createdAt),
  };
}

export function mapListResponseToViewModel(response: ListFlashcardsResponseDto): FlashcardsListVM {
  return {
    items: response.items.map(mapFlashcardDtoToRow),
    pagination: response.pagination,
  };
}

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
