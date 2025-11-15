import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { getFlashcard, ensureApiError } from "@/lib/api/flashcards";
import type { FlashcardDto } from "@/types";
import { Toaster } from "@/components/ui/sonner";

import type { FlashcardRowVM, FlashcardsFiltersVM, FlashcardsListVM } from "./types";
import {
  useEditDialogState,
  useFlashcardsQuery,
  useFlashcardsSearchParams,
} from "./hooks";
import { CreateFlashcardDialog } from "./CreateFlashcardDialog";
import { DeleteFlashcardAlert } from "./DeleteFlashcardAlert";
import { EditFlashcardDialog } from "./EditFlashcardDialog";
import { EmptyState } from "./EmptyState";
import { FiltersBar } from "./FiltersBar";
import { FlashcardsTable } from "./FlashcardsTable";
import { HeaderActions } from "./HeaderActions";
import { Pagination } from "./Pagination";
import { TableSkeleton } from "./TableSkeleton";
import { mapFlashcardDtoToRow } from "./mappers";

function mapRowToDto(row: FlashcardRowVM): FlashcardDto {
  return {
    id: row.id,
    front: row.front,
    back: row.back,
    source: row.source,
    generationId: row.generationId,
    createdAt: row.createdAtISO,
    updatedAt: row.updatedAtISO,
  };
}

export function FlashcardsView() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [editInitial, setEditInitial] = useState<FlashcardDto | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [overrides, setOverrides] = useState<Record<number, FlashcardRowVM>>({});

  const { filters, replaceFilters, resetFilters, setOrder, setPage } = useFlashcardsSearchParams();
  const { data, isLoading, error, refetch } = useFlashcardsQuery(filters);
  const {
    editId,
    isOpen: isEditDialogOpen,
    openDialog: openEditDialog,
    closeDialog: closeEditDialog,
    onOpenChange: handleEditOpenChange,
  } = useEditDialogState();

  const listState = useMemo<FlashcardsListVM>(() => {
    if (!data) {
      return {
        items: [],
        pagination: {
          page: filters.page,
          pageSize: filters.pageSize,
          total: 0,
        },
      };
    }

    const items = data.items.map((item) => overrides[item.id] ?? item);

    return {
      items,
      pagination: data.pagination,
    };
  }, [data, filters.page, filters.pageSize, overrides]);
  useEffect(() => {
    if (!data) {
      return;
    }

    setOverrides((prev) => {
      let mutated = false;
      const next = { ...prev };

      for (const [idKey, override] of Object.entries(prev)) {
        const id = Number(idKey);
        const latest = data.items.find((item) => item.id === id);

        if (!latest) {
          delete next[id];
          mutated = true;
          continue;
        }

        if (latest.updatedAtISO === override.updatedAtISO && latest.source === override.source) {
          delete next[id];
          mutated = true;
        }
      }

      return mutated ? next : prev;
    });
  }, [data]);


  const hasItems = listState.items.length > 0;
  const showEmptyState = !isLoading && !hasItems && !error;

  useEffect(() => {
    if (!isEditDialogOpen || !editId) {
      setEditInitial(null);
      setIsEditLoading(false);
      return;
    }

    const match = listState.items.find((row) => row.id === editId);

    if (match) {
      setEditInitial(mapRowToDto(match));
      setIsEditLoading(false);
      return;
    }

    let cancelled = false;
    const fetchFlashcard = async () => {
      setIsEditLoading(true);

      try {
        const dto = await getFlashcard(editId);

        if (cancelled) {
          return;
        }

        setEditInitial(dto);
      } catch (cause) {
        if (cancelled) {
          return;
        }

        const apiError = ensureApiError(cause);

        if (apiError.status === 404) {
          toast.error("Nie znaleziono wskazanej fiszki. Widok zostanie odświeżony.");
        } else {
          toast.error(apiError.message);
        }

        closeEditDialog();
        await refetch();
      } finally {
        if (!cancelled) {
          setIsEditLoading(false);
        }
      }
    };

    fetchFlashcard();

    return () => {
      cancelled = true;
    };
  }, [closeEditDialog, editId, isEditDialogOpen, listState.items, refetch]);

  const handleFiltersChange = useCallback(
    (next: FlashcardsFiltersVM) => {
      replaceFilters(next, "replace");
    },
    [replaceFilters]
  );

  const handleToggleOrder = useCallback(() => {
    setOrder(filters.order === "asc" ? "desc" : "asc");
  }, [filters.order, setOrder]);

  const handleCreated = useCallback(
    async (created: FlashcardDto[]) => {
      if (created.length === 0) {
        return;
      }

      toast.success(created.length === 1 ? "Dodano nową fiszkę." : `Dodano ${created.length} nowych fiszek.`);
      setIsCreateDialogOpen(false);
      if (filters.page !== 1) {
        replaceFilters(
          {
            ...filters,
            page: 1,
          },
          "replace"
        );
      } else {
        await refetch();
      }
    },
    [filters, refetch, replaceFilters]
  );

  const handleUpdated = useCallback(
    async (updated: FlashcardDto) => {
      toast.success("Zapisano zmiany w fiszce.");
      closeEditDialog();
      setEditInitial(updated);
      setOverrides((prev) => ({
        ...prev,
        [updated.id]: mapFlashcardDtoToRow(updated),
      }));
      await refetch();
    },
    [closeEditDialog, refetch]
  );

  const handleDeleted = useCallback(
    async (id: number) => {
      toast.success("Fiszka została usunięta.");
      setDeleteTargetId(null);
      setOverrides((prev) => {
        if (!prev[id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });
      const isLastItemOnPage = listState.items.length === 1 && listState.pagination.page > 1;

      if (isLastItemOnPage) {
        setPage(listState.pagination.page - 1);
      } else {
        await refetch();
      }
    },
    [listState.items.length, listState.pagination.page, refetch, setPage]
  );

  const handleDeleteOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setDeleteTargetId(null);
    }
  }, []);

  return (
    <>
      <div className="container mx-auto flex w-full max-w-6xl flex-col gap-8 py-12">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">Moje fiszki</h1>
          <p className="text-muted-foreground text-base">
            Zarządzaj wygenerowanymi fiszkami, filtruj listę i edytuj treści według potrzeb.
          </p>
        </header>

        <section>
          <FiltersBar value={filters} onChange={handleFiltersChange} onReset={resetFilters} busy={isLoading} />
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <HeaderActions onAdd={() => setIsCreateDialogOpen(true)} busy={isLoading} />
            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                Nie udało się pobrać listy fiszek. {error.message}
              </div>
            ) : null}
          </div>

          {isLoading ? (
            <TableSkeleton rows={filters.pageSize} />
          ) : showEmptyState ? (
            <EmptyState onAdd={() => setIsCreateDialogOpen(true)} />
          ) : (
            <FlashcardsTable
              items={listState.items}
              order={filters.order}
              onToggleOrder={handleToggleOrder}
              onEdit={(id) => openEditDialog(id)}
              onDelete={(id) => setDeleteTargetId(id)}
              busy={isLoading}
            />
          )}
        </section>

        <Pagination
          page={listState.pagination.page}
          pageSize={listState.pagination.pageSize}
          total={listState.pagination.total}
          onPageChange={setPage}
          busy={isLoading}
        />
      </div>

      <CreateFlashcardDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreated={handleCreated}
      />

      <EditFlashcardDialog
        id={editId}
        open={isEditDialogOpen}
        onOpenChange={handleEditOpenChange}
        initial={editInitial}
        onUpdated={handleUpdated}
        isPrefetching={isEditLoading}
      />

      <DeleteFlashcardAlert
        id={deleteTargetId}
        open={deleteTargetId !== null}
        onOpenChange={handleDeleteOpenChange}
        onDeleted={handleDeleted}
      />

      <Toaster />
    </>
  );
}

export default FlashcardsView;
