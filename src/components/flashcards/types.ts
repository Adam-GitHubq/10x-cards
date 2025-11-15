import type { FlashcardDto, FlashcardSource, PaginationDto } from "@/types";

export type FlashcardsFiltersVM = {
  page: number;
  pageSize: number;
  sort: "createdAt";
  order: "asc" | "desc";
  source?: FlashcardSource;
  generationId?: number;
};

export type FlashcardRowVM = {
  id: FlashcardDto["id"];
  front: FlashcardDto["front"];
  back: FlashcardDto["back"];
  source: FlashcardSource;
  generationId: FlashcardDto["generationId"];
  createdAtISO: FlashcardDto["createdAt"];
  updatedAtISO: FlashcardDto["updatedAt"];
  createdAtLabel: string;
};

export type FlashcardsListVM = {
  items: FlashcardRowVM[];
  pagination: PaginationDto;
};


