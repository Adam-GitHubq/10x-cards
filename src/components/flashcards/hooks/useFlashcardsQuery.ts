import { useCallback, useEffect, useRef, useState } from "react";

import { ensureApiError, listFlashcards, type ApiError } from "@/lib/api/flashcards";

import { mapListResponseToViewModel } from "../mappers";
import type { FlashcardsFiltersVM, FlashcardsListVM } from "../types";

type FetchState = {
  isLoading: boolean;
  error: ApiError | null;
  data: FlashcardsListVM | null;
};

const INITIAL_STATE: FetchState = {
  isLoading: false,
  error: null,
  data: null,
};

export function useFlashcardsQuery(filters: FlashcardsFiltersVM) {
  const [state, setState] = useState<FetchState>(INITIAL_STATE);
  const latestFiltersRef = useRef(filters);
  const abortRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  useEffect(() => {
    latestFiltersRef.current = filters;
  }, [filters]);

  const runFetch = useCallback(async (activeFilters: FlashcardsFiltersVM) => {
    abortRef.current.cancelled = false;
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const response = await listFlashcards({
        page: activeFilters.page,
        pageSize: activeFilters.pageSize,
        sort: activeFilters.sort,
        order: activeFilters.order,
        source: activeFilters.source,
        generationId: activeFilters.generationId,
      });

      if (abortRef.current.cancelled) {
        return;
      }

      setState({
        isLoading: false,
        error: null,
        data: mapListResponseToViewModel(response),
      });
    } catch (error) {
      if (abortRef.current.cancelled) {
        return;
      }

      setState({
        isLoading: false,
        error: ensureApiError(error),
        data: null,
      });
    }
  }, []);

  useEffect(() => {
    abortRef.current.cancelled = false;

    const fetchData = async () => {
      await runFetch(filters);
    };

    fetchData();

    return () => {
      abortRef.current.cancelled = true;
    };
  }, [filters, runFetch]);

  const refetch = useCallback(async () => {
    await runFetch(latestFiltersRef.current);
  }, [runFetch]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch,
  };
}

export type UseFlashcardsQueryResult = ReturnType<typeof useFlashcardsQuery>;
