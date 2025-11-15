import { useCallback, useReducer, useRef } from "react";
import { toast } from "sonner";

import { isHttpError } from "@/lib/http";

import { GenerationForm } from "./GenerationForm";
import { GenerationSummaryBar } from "./GenerationSummaryBar";
import { ProposalsSection } from "./ProposalsSection";
import { useGeneration } from "./hooks/useGeneration";
import { useSaveApproved } from "./hooks/useSaveApproved";
import { mapGenerationResponseToViewModel } from "./mappers";
import { generateViewReducer, initialState } from "./state";
import type { ProposalFieldEdit } from "./types";
import { Toaster } from "@/components/ui/sonner";

const MIN_TEXT_LENGTH = 1000;
const MAX_TEXT_LENGTH = 10000;

function buildLengthError(length: number) {
  return `Tekst po przycięciu powinien mieć od ${MIN_TEXT_LENGTH} do ${MAX_TEXT_LENGTH} znaków (obecnie ${length}).`;
}

function extractIssuesMessages(body: unknown): string[] {
  if (!body || typeof body !== "object") {
    return [];
  }

  const issues = (body as { issues?: unknown }).issues;

  if (!issues || typeof issues !== "object") {
    return [];
  }

  const { formErrors, fieldErrors } = issues as {
    formErrors?: unknown;
    fieldErrors?: Record<string, unknown>;
  };

  const messages: string[] = [];

  if (Array.isArray(formErrors)) {
    for (const entry of formErrors) {
      if (typeof entry === "string") {
        messages.push(entry);
      }
    }
  }

  if (fieldErrors && typeof fieldErrors === "object") {
    for (const [, value] of Object.entries(fieldErrors)) {
      if (Array.isArray(value)) {
        for (const entry of value) {
          if (typeof entry === "string") {
            messages.push(entry);
          }
        }
      }
    }
  }

  return messages;
}

function extractErrorMessage(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const maybeMessage = (body as { message?: unknown }).message;

  return typeof maybeMessage === "string" ? maybeMessage : null;
}

export function GenerateView() {
  const [state, dispatch] = useReducer(generateViewReducer, initialState);
  const { trigger: triggerGeneration, isLoading: isGenerationLoading } = useGeneration();
  const { trigger: triggerSaveApproved, isSaving: isSaveLoading } = useSaveApproved();
  const requestInFlightRef = useRef(false);

  const handleTextChange = useCallback((value: string) => {
    dispatch({ type: "SET_TEXT", payload: value });
    dispatch({ type: "CLEAR_FORM_ERRORS" });
    dispatch({ type: "CLEAR_GENERATION_ERROR" });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (requestInFlightRef.current || state.phase === "generating" || isGenerationLoading) {
      return;
    }

    const trimmed = state.sourceText.trim();

    if (trimmed.length < MIN_TEXT_LENGTH || trimmed.length > MAX_TEXT_LENGTH) {
      dispatch({
        type: "SET_FORM_ERRORS",
        payload: [buildLengthError(trimmed.length)],
      });
      return;
    }

    dispatch({ type: "CLEAR_FORM_ERRORS" });
    dispatch({ type: "CLEAR_GENERATION_ERROR" });
    dispatch({ type: "REQUEST_GENERATION" });
    requestInFlightRef.current = true;

    try {
      const response = await triggerGeneration(trimmed);
      const viewModel = mapGenerationResponseToViewModel(response);
      dispatch({ type: "SET_GENERATION_RESULT", payload: viewModel });
      toast.success(`Wygenerowano ${viewModel.proposals.length} propozycji fiszek.`);
    } catch (error) {
      if (isHttpError(error)) {
        if (error.status === 400) {
          const messages = extractIssuesMessages(error.body);

          dispatch({
            type: "SET_FORM_ERRORS",
            payload:
              messages.length > 0
                ? messages
                : [extractErrorMessage(error.body) ?? "Body żądania nie przeszło walidacji."],
          });
        } else {
          dispatch({
            type: "SET_GENERATION_ERROR",
            payload:
              extractErrorMessage(error.body) ?? "Nie udało się uruchomić generowania. Spróbuj ponownie później.",
          });
        }
      } else {
        dispatch({
          type: "SET_GENERATION_ERROR",
          payload: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
        });
      }

      dispatch({ type: "SET_PHASE", payload: "error" });
    } finally {
      requestInFlightRef.current = false;
    }
  }, [state.phase, state.sourceText, triggerGeneration, isGenerationLoading]);

  const handleEditProposal = useCallback((payload: ProposalFieldEdit) => {
    dispatch({ type: "EDIT_PROPOSAL", payload });
  }, []);

  const handleToggleApprove = useCallback((id: string, approved: boolean) => {
    dispatch({ type: "TOGGLE_APPROVE", payload: { id, approved } });
  }, []);

  const handleApproveAll = useCallback(() => {
    dispatch({ type: "APPROVE_ALL" });
  }, []);

  const handleRejectAll = useCallback(() => {
    dispatch({ type: "REJECT_ALL" });
  }, []);

  const handleClearAll = useCallback(() => {
    dispatch({ type: "CLEAR_ALL" });
  }, []);

  const handleSaveApproved = useCallback(async () => {
    if (!state.generation) {
      toast.error("Brak aktywnej generacji. Wygeneruj fiszki przed zapisem.");
      return;
    }

    if (state.approvedCount === 0) {
      toast.info("Zaznacz co najmniej jedną poprawną fiszkę przed zapisem.");
      return;
    }

    if (state.hasApprovedErrors) {
      toast.error("Popraw błędy w zatwierdzonych fiszkach, zanim je zapiszesz.");
      return;
    }

    dispatch({ type: "SET_SAVING", payload: true });

    try {
      const response = await triggerSaveApproved({
        generationId: state.generation.generation.id,
        proposals: state.proposals,
      });

      toast.success(`Zapisano ${response.flashcards.length} fiszek.`);
      dispatch({ type: "REJECT_ALL" });
    } catch (error) {
      if (isHttpError(error)) {
        const message = extractErrorMessage(error.body) ?? "Nie udało się zapisać fiszek. Spróbuj ponownie później.";
        toast.error(message);
      } else {
        toast.error("Wystąpił nieoczekiwany błąd podczas zapisu.");
      }
    } finally {
      dispatch({ type: "SET_SAVING", payload: false });
    }
  }, [state.generation, state.approvedCount, state.hasApprovedErrors, state.proposals, triggerSaveApproved]);

  const truncatedBy =
    state.generation && state.generation.totalProposals > state.proposals.length
      ? state.generation.totalProposals - state.proposals.length
      : 0;

  return (
    <>
      <div className="container mx-auto flex w-full max-w-6xl flex-col gap-10 py-12">
        <section className="flex flex-col gap-6">
          <GenerationForm
            value={state.sourceText}
            onChange={handleTextChange}
            onSubmit={handleSubmit}
            isLoading={state.phase === "generating" || isGenerationLoading}
            errors={state.formErrors}
          />
          {state.generationError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {state.generationError}
            </div>
          ) : null}
        </section>

        {state.generation ? <GenerationSummaryBar generation={state.generation.generation} /> : null}

        <ProposalsSection
          proposals={state.proposals}
          approvedCount={state.approvedCount}
          hasApprovedErrors={state.hasApprovedErrors}
          isSaving={isSaveLoading || state.isSaving}
          canSave={Boolean(state.generation)}
          phase={state.phase}
          onEdit={handleEditProposal}
          onToggleApprove={handleToggleApprove}
          onApproveAll={handleApproveAll}
          onRejectAll={handleRejectAll}
          onClear={handleClearAll}
          onSaveApproved={handleSaveApproved}
          truncatedBy={truncatedBy}
        />
      </div>
      <Toaster />
    </>
  );
}

export default GenerateView;
