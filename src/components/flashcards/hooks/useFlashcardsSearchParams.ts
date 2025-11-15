import { useCallback, useEffect, useMemo, useState } from "react";

import type { FlashcardSource } from "@/types";

import type { FlashcardsFiltersVM } from "../types";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT: FlashcardsFiltersVM["sort"] = "createdAt";
const DEFAULT_ORDER: FlashcardsFiltersVM["order"] = "desc";

const ALLOWED_SOURCES: FlashcardSource[] = ["manual", "ai-full", "ai-edited"];

type HistoryAction = "replace" | "push";

type UpdateOptions = {
  /**
   * Wymuszenie resetu strony do pierwszej.
   */
  resetPage?: boolean;
  /**
   * Kontrola sposobu aktualizacji historii przeglądarki.
   */
  history?: HistoryAction;
};

const DEFAULT_FILTERS: FlashcardsFiltersVM = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  sort: DEFAULT_SORT,
  order: DEFAULT_ORDER,
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function clampPage(value: number | null | undefined): number {
  if (!value || Number.isNaN(value)) {
    return DEFAULT_PAGE;
  }

  const intValue = Math.trunc(value);

  if (intValue < 1) {
    return DEFAULT_PAGE;
  }

  return intValue;
}

function parseOrder(value: string | null | undefined): FlashcardsFiltersVM["order"] {
  return value === "asc" ? "asc" : DEFAULT_ORDER;
}

function parseSource(value: string | null | undefined): FlashcardSource | undefined {
  if (!value) {
    return undefined;
  }

  return ALLOWED_SOURCES.includes(value as FlashcardSource) ? (value as FlashcardSource) : undefined;
}

function parsePositiveInt(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function normalizeFilters(input: Partial<FlashcardsFiltersVM>): FlashcardsFiltersVM {
  const page = clampPage(input.page);
  const order = parseOrder(input.order ?? null);
  const source = parseSource(input.source ?? undefined);
  const generationId = parsePositiveInt(input.generationId);

  return {
    page,
    pageSize: DEFAULT_PAGE_SIZE,
    sort: DEFAULT_SORT,
    order,
    source,
    generationId,
  };
}

function parseFromSearch(search: string): FlashcardsFiltersVM {
  const params = new URLSearchParams(search);
  const pageParam = params.get("page");
  const orderParam = params.get("order");
  const sourceParam = params.get("source");
  const generationIdParam = params.get("generationId");

  return {
    page: clampPage(pageParam ? Number(pageParam) : undefined),
    pageSize: DEFAULT_PAGE_SIZE,
    sort: DEFAULT_SORT,
    order: parseOrder(orderParam),
    source: parseSource(sourceParam),
    generationId: parsePositiveInt(generationIdParam),
  };
}

function serializeFilters(filters: FlashcardsFiltersVM): string {
  const params = new URLSearchParams();

  if (filters.page !== DEFAULT_PAGE) {
    params.set("page", String(filters.page));
  }

  if (filters.pageSize !== DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(filters.pageSize));
  }

  if (filters.sort !== DEFAULT_SORT) {
    params.set("sort", filters.sort);
  }

  if (filters.order !== DEFAULT_ORDER) {
    params.set("order", filters.order);
  }

  if (filters.source) {
    params.set("source", filters.source);
  }

  if (typeof filters.generationId === "number") {
    params.set("generationId", String(filters.generationId));
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

function areFiltersEqual(a: FlashcardsFiltersVM, b: FlashcardsFiltersVM): boolean {
  return (
    a.page === b.page &&
    a.pageSize === b.pageSize &&
    a.sort === b.sort &&
    a.order === b.order &&
    a.source === b.source &&
    a.generationId === b.generationId
  );
}

function updateBrowserUrl(filters: FlashcardsFiltersVM, action: HistoryAction) {
  if (!isBrowser()) {
    return;
  }

  const nextSearch = serializeFilters(filters);
  const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash ?? ""}`;
  const historyAction = action === "push" ? "pushState" : "replaceState";

  window.history[historyAction]?.(window.history.state, "", nextUrl);
}

export function useFlashcardsSearchParams() {
  const initialFilters = useMemo<FlashcardsFiltersVM>(
    () => (isBrowser() ? parseFromSearch(window.location.search) : DEFAULT_FILTERS),
    []
  );

  const [filters, setFilters] = useState<FlashcardsFiltersVM>(initialFilters);

  useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }

    const handlePopState = () => {
      setFilters(parseFromSearch(window.location.search));
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const replaceFilters = useCallback(
    (next: FlashcardsFiltersVM, history: HistoryAction = "replace") => {
      const normalized = normalizeFilters(next);

      setFilters((prev) => {
        if (areFiltersEqual(prev, normalized)) {
          return prev;
        }

        updateBrowserUrl(normalized, history);
        return normalized;
      });
    },
    []
  );

  const updateFilters = useCallback(
    (partial: Partial<FlashcardsFiltersVM>, options: UpdateOptions = {}) => {
      setFilters((prev) => {
        const normalized = normalizeFilters({
          ...prev,
          ...(options.resetPage ? { page: DEFAULT_PAGE } : {}),
          ...partial,
        });

        if (areFiltersEqual(prev, normalized)) {
          return prev;
        }

        updateBrowserUrl(normalized, options.history ?? "replace");
        return normalized;
      });
    },
    []
  );

  const resetFilters = useCallback(() => {
    replaceFilters(DEFAULT_FILTERS, "replace");
  }, [replaceFilters]);

  const setPage = useCallback(
    (page: number) => {
      updateFilters({ page }, { history: "push" });
    },
    [updateFilters]
  );

  const setOrder = useCallback(
    (order: FlashcardsFiltersVM["order"]) => {
      updateFilters({ order }, { resetPage: true, history: "replace" });
    },
    [updateFilters]
  );

  return {
    filters,
    replaceFilters,
    updateFilters,
    resetFilters,
    setPage,
    setOrder,
  };
}

export type UseFlashcardsSearchParamsResult = ReturnType<typeof useFlashcardsSearchParams>;


