import { useCallback, useEffect, useMemo, useState } from "react";

const EDIT_QUERY_KEY = "edit";

type HistoryAction = "replace" | "push";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function parseEditParam(search: string): number | null {
  const params = new URLSearchParams(search);
  const raw = params.get(EDIT_QUERY_KEY);

  if (!raw) {
    return null;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }

  return value;
}

function updateEditParam(id: number | null, action: HistoryAction) {
  if (!isBrowser()) {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  if (id === null) {
    params.delete(EDIT_QUERY_KEY);
  } else {
    params.set(EDIT_QUERY_KEY, String(id));
  }

  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash ?? ""}`;
  const historyMethod = action === "push" ? "pushState" : "replaceState";

  window.history[historyMethod]?.(window.history.state, "", nextUrl);
}

function removeInvalidEditParam() {
  if (!isBrowser()) {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  if (!params.has(EDIT_QUERY_KEY)) {
    return;
  }

  const parsed = parseEditParam(window.location.search);

  if (parsed !== null) {
    return;
  }

  params.delete(EDIT_QUERY_KEY);
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash ?? ""}`;
  window.history.replaceState(window.history.state, "", nextUrl);
}

export function useEditDialogState() {
  const initialId = useMemo<number | null>(() => {
    if (!isBrowser()) {
      return null;
    }

    const parsed = parseEditParam(window.location.search);

    if (parsed === null) {
      removeInvalidEditParam();
    }

    return parsed;
  }, []);

  const [editId, setEditId] = useState<number | null>(initialId);
  const [isOpen, setIsOpen] = useState<boolean>(initialId !== null);

  useEffect(() => {
    setIsOpen(editId !== null);
  }, [editId]);

  useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }

    const handlePopState = () => {
      const nextId = parseEditParam(window.location.search);

      if (nextId === null) {
        removeInvalidEditParam();
      }

      setEditId(nextId);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const openDialog = useCallback((id: number, history: HistoryAction = "push") => {
    setEditId(id);
    setIsOpen(true);
    updateEditParam(id, history);
  }, []);

  const closeDialog = useCallback(() => {
    setEditId(null);
    setIsOpen(false);
    updateEditParam(null, "replace");
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        if (editId === null) {
          return;
        }

        setIsOpen(true);
        updateEditParam(editId, "replace");
        return;
      }

      closeDialog();
    },
    [closeDialog, editId]
  );

  return {
    editId,
    isOpen,
    openDialog,
    closeDialog,
    onOpenChange: handleOpenChange,
    setEditId,
  };
}

export type UseEditDialogStateResult = ReturnType<typeof useEditDialogState>;


