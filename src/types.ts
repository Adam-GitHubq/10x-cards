import type { Database, Tables } from './db/database.types'

type IsoDateString = string

export type FlashcardSource = 'manual' | 'ai-full' | 'ai-edited'

type GenerationRow = Tables<'generations'>
type FlashcardRow = Tables<'flashcards'>
type GenerationErrorLogRow = Tables<'generation_error_logs'>

/**
 * Standaryzowana struktura metadanych paginacji.
 */
export type PaginationDto = {
  page: number
  pageSize: number
  total: number
}

/**
 * Wspólny kształt odpowiedzi listujących.
 */
export type PaginatedResponse<Item> = {
  items: Item[]
  pagination: PaginationDto
}

/**
 * Polecenie uruchomienia procesu generowania kart.
 * Model i limity są ustalane po stronie serwera.
 */
export type CreateGenerationCommand = {
  sourceText: string
}

/**
 * Metadane generacji zwracane w kontekście standardowych operacji.
 */
export type GenerationBaseDto = {
  id: GenerationRow['id']
  model: GenerationRow['model']
  sourceTextHash: GenerationRow['source_text_hash']
  sourceTextLength: GenerationRow['source_text_length']
  generatedCount: GenerationRow['generated_count']
  generationDuration: GenerationRow['generation_duration']
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

/**
 * Rozszerzenie bazowej struktury o liczniki zaakceptowanych kart (mogą pozostać null).
 */
export type GenerationWithAcceptanceDto = GenerationBaseDto & {
  acceptedUneditedCount: GenerationRow['accepted_unedited_count']
  acceptedEditedCount: GenerationRow['accepted_edited_count']
}

/**
 * Pojedyncza propozycja karty zwrócona przez LLM.
 */
export type FlashcardProposalDto = {
  front: string
  back: string
  source: "ai-full"
}

/**
 * Odpowiedź po utworzeniu generacji wraz z propozycjami kart.
 */
export type CreateGenerationResponseDto = {
  generation: GenerationBaseDto
  flashcardsProposals: FlashcardProposalDto[]
}

/**
 * Parametry filtrowania oraz sortowania listy generacji.
 */
export type GenerationListQueryParams = {
  page?: number
  pageSize?: number
  sort?: 'createdAt' | '-createdAt'
  model?: GenerationRow['model']
  createdFrom?: IsoDateString
  createdTo?: IsoDateString
}

/**
 * Lista generacji (z licznikami zaakceptowanych kart) z paginacją.
 */
export type ListGenerationsResponseDto = PaginatedResponse<GenerationWithAcceptanceDto>

/**
 * Szczegóły pojedynczej generacji.
 */
export type GetGenerationResponseDto = GenerationWithAcceptanceDto

/**
 * Pojedynczy element polecenia tworzenia kart.
 */
export type CreateFlashcardItemCommand = {
  front: string
  back: string
  source: FlashcardSource
  generationId?: FlashcardRow['generation_id']
}

/**
 * Polecenie utworzenia zestawu kart.
 */
export type CreateFlashcardsCommand = {
  cards: CreateFlashcardItemCommand[]
}

/**
 * Reprezentacja karty w odpowiedziach API.
 */
export type FlashcardDto = {
  id: FlashcardRow['id']
  generationId: FlashcardRow['generation_id']
  source: FlashcardSource
  front: FlashcardRow['front']
  back: FlashcardRow['back']
  createdAt: IsoDateString
  updatedAt: IsoDateString
}

/**
 * Odpowiedź po utworzeniu kart.
 */
export type CreateFlashcardsResponseDto = {
  flashcards: FlashcardDto[]
}

/**
 * Parametry filtrowania listy kart.
 */
export type FlashcardListQueryParams = {
  page?: number
  pageSize?: number
  sort?: 'createdAt' | '-createdAt'
  order?: 'asc' | 'desc'
  source?: FlashcardSource
  generationId?: FlashcardRow['generation_id']
}

/**
 * Lista kart z paginacją.
 */
export type ListFlashcardsResponseDto = {
  items: FlashcardDto[]
  pagination: PaginationDto
}

/**
 * Szczegóły pojedynczej karty.
 */
export type GetFlashcardResponseDto = FlashcardDto

/**
 * Polecenie aktualizacji treści karty.
 */
export type UpdateFlashcardCommand = {
  front: string
  back: string
}

/**
 * Log błędu generacji.
 */
export type GenerationErrorLogDto = {
  id: GenerationErrorLogRow['id']
  userId: GenerationErrorLogRow['user_id']
  model: GenerationErrorLogRow['model']
  sourceTextHash: GenerationErrorLogRow['source_text_hash']
  sourceTextLength: GenerationErrorLogRow['source_text_length']
  errorCode: GenerationErrorLogRow['error_code']
  errorMessage: GenerationErrorLogRow['error_message']
  createdAt: IsoDateString
}

/**
 * Lista logów błędów generacji z paginacją.
 */
export type ListGenerationErrorLogsResponseDto = PaginatedResponse<GenerationErrorLogDto>

/**
 * Odpowiedź endpointu health-check.
 */
export type HealthResponseDto = {
  status: string
}

/**
 * Odpowiedź z informacjami o wersji.
 */
export type VersionResponseDto = {
  version: string
  commit: string
  env: string
}

/**
 * Struktura błędu API.
 */
export type ApiErrorInfo = {
  code: string
  message: string
  details?: Record<string, unknown>
}

export type ApiErrorResponseDto = {
  error: ApiErrorInfo
}
