import type {
  GenerateViewAction,
  GenerateViewState,
  ProposalEditableField,
  ProposalValidationErrors,
  ProposalViewModel,
} from "./types";

const FRONT_MIN_LENGTH = 1;
const FRONT_MAX_LENGTH = 200;
const BACK_MIN_LENGTH = 1;
const BACK_MAX_LENGTH = 500;

function validateField(field: ProposalEditableField, value: string): string | undefined {
  const length = value.trim().length;

  if (length === 0) {
    return field === "front" ? "Przód fiszki nie może być pusty." : "Tył fiszki nie może być pusty.";
  }

  if (field === "front" && (length < FRONT_MIN_LENGTH || length > FRONT_MAX_LENGTH)) {
    return `Przód powinien mieć od ${FRONT_MIN_LENGTH} do ${FRONT_MAX_LENGTH} znaków.`;
  }

  if (field === "back" && (length < BACK_MIN_LENGTH || length > BACK_MAX_LENGTH)) {
    return `Tył powinien mieć od ${BACK_MIN_LENGTH} do ${BACK_MAX_LENGTH} znaków.`;
  }

  return undefined;
}

function mapProposalErrors(proposal: ProposalViewModel): ProposalValidationErrors {
  return {
    front: validateField("front", proposal.front),
    back: validateField("back", proposal.back),
  };
}

function deriveAggregates(proposals: ProposalViewModel[]) {
  const approved = proposals.filter((proposal) => proposal.approved);
  const approvedCount = approved.length;
  const hasApprovedErrors = approved.some(
    (proposal) => Boolean(proposal.errors.front) || Boolean(proposal.errors.back)
  );

  return { approvedCount, hasApprovedErrors };
}

export const initialState: GenerateViewState = {
  sourceText: "",
  phase: "idle",
  generation: null,
  proposals: [],
  approvedCount: 0,
  hasApprovedErrors: false,
  formErrors: [],
  generationError: null,
  isSaving: false,
};

export function generateViewReducer(state: GenerateViewState, action: GenerateViewAction): GenerateViewState {
  switch (action.type) {
    case "SET_TEXT":
      return {
        ...state,
        sourceText: action.payload,
      };
    case "RESET":
      return {
        ...initialState,
      };
    case "SET_PHASE":
      return {
        ...state,
        phase: action.payload,
      };
    case "SET_FORM_ERRORS":
      return {
        ...state,
        formErrors: action.payload,
      };
    case "CLEAR_FORM_ERRORS":
      return {
        ...state,
        formErrors: [],
      };
    case "SET_GENERATION_ERROR":
      return {
        ...state,
        generationError: action.payload,
      };
    case "CLEAR_GENERATION_ERROR":
      return {
        ...state,
        generationError: null,
      };
    case "REQUEST_GENERATION":
      return {
        ...state,
        phase: "generating",
        generationError: null,
        generation: null,
        proposals: [],
        approvedCount: 0,
        hasApprovedErrors: false,
      };
    case "SET_GENERATION_RESULT": {
      const proposals = action.payload.proposals.map((proposal) => ({
        ...proposal,
        errors: mapProposalErrors(proposal),
      }));

      return {
        ...state,
        phase: "ready",
        generation: action.payload,
        proposals,
        ...deriveAggregates(proposals),
        formErrors: [],
        generationError: null,
      };
    }
    case "EDIT_PROPOSAL": {
      const proposals = state.proposals.map((proposal) => {
        if (proposal.id !== action.payload.id) {
          return proposal;
        }

        const rawValue = action.payload.value;
        const trimmedValue = rawValue.trim();
        const nextProposal: ProposalViewModel = {
          ...proposal,
          [action.payload.field]: rawValue,
        };

        const originalTrimmed = nextProposal.original[action.payload.field];

        if (originalTrimmed !== trimmedValue) {
          nextProposal.source = "ai-edited";
        } else {
          const nextFrontTrimmed = nextProposal.front.trim();
          const nextBackTrimmed = nextProposal.back.trim();

          if (nextProposal.original.front === nextFrontTrimmed && nextProposal.original.back === nextBackTrimmed) {
            nextProposal.source = nextProposal.original.source;
          }
        }

        const nextErrors = {
          ...nextProposal.errors,
          [action.payload.field]: validateField(action.payload.field, rawValue),
        };

        if (!nextErrors[action.payload.field]) {
          delete nextErrors[action.payload.field];
        }

        nextProposal.errors = nextErrors;

        return nextProposal;
      });

      return {
        ...state,
        proposals,
        ...deriveAggregates(proposals),
      };
    }
    case "TOGGLE_APPROVE": {
      const proposals = state.proposals.map((proposal) =>
        proposal.id === action.payload.id ? { ...proposal, approved: action.payload.approved } : proposal
      );

      return {
        ...state,
        proposals,
        ...deriveAggregates(proposals),
      };
    }
    case "APPROVE_ALL": {
      const proposals = state.proposals.map((proposal) => ({
        ...proposal,
        approved: true,
      }));

      return {
        ...state,
        proposals,
        ...deriveAggregates(proposals),
      };
    }
    case "REJECT_ALL": {
      const proposals = state.proposals.map((proposal) => ({
        ...proposal,
        approved: false,
      }));

      return {
        ...state,
        proposals,
        ...deriveAggregates(proposals),
      };
    }
    case "CLEAR_ALL":
      return {
        ...state,
        proposals: [],
        approvedCount: 0,
        hasApprovedErrors: false,
      };
    case "SET_SAVING":
      return {
        ...state,
        isSaving: action.payload,
      };
    default:
      return state;
  }
}
