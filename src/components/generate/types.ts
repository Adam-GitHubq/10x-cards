import type { FlashcardSource, GenerationBaseDto } from "@/types";

export type ProposalValidationErrors = {
  front?: string;
  back?: string;
};

export type ProposalEditableField = "front" | "back";

export type ProposalViewModel = {
  id: string;
  front: string;
  back: string;
  source: FlashcardSource;
  approved: boolean;
  errors: ProposalValidationErrors;
  original: {
    front: string;
    back: string;
    source: FlashcardSource;
  };
};

export type ViewPhase = "idle" | "generating" | "ready" | "error";

export type ProposalFieldEdit = {
  id: string;
  field: ProposalEditableField;
  value: string;
};

export type GenerationResultViewModel = {
  generation: GenerationBaseDto;
  proposals: ProposalViewModel[];
  totalProposals: number;
};

export type GenerateViewState = {
  sourceText: string;
  phase: ViewPhase;
  generation: GenerationResultViewModel | null;
  proposals: ProposalViewModel[];
  approvedCount: number;
  hasApprovedErrors: boolean;
  formErrors: string[];
  generationError: string | null;
  isSaving: boolean;
};

export type GenerateViewAction =
  | { type: "SET_TEXT"; payload: string }
  | { type: "RESET" }
  | { type: "SET_PHASE"; payload: ViewPhase }
  | { type: "SET_FORM_ERRORS"; payload: string[] }
  | { type: "CLEAR_FORM_ERRORS" }
  | { type: "SET_GENERATION_ERROR"; payload: string }
  | { type: "CLEAR_GENERATION_ERROR" }
  | { type: "REQUEST_GENERATION" }
  | { type: "SET_GENERATION_RESULT"; payload: GenerationResultViewModel }
  | { type: "EDIT_PROPOSAL"; payload: ProposalFieldEdit }
  | { type: "TOGGLE_APPROVE"; payload: { id: string; approved: boolean } }
  | { type: "APPROVE_ALL" }
  | { type: "REJECT_ALL" }
  | { type: "CLEAR_ALL" }
  | { type: "SET_SAVING"; payload: boolean };
