import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "10x-cards-theme";

const applyTheme = (mode: ThemeMode) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = mode;
  document.documentElement.classList.toggle("dark", mode === "dark");
};

const resolvePreferredTheme = (): ThemeMode => {
  if (typeof window === "undefined") {
    return "light";
  }

  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === "dark" || stored === "light") {
    return stored;
  }

  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
};

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const next = resolvePreferredTheme();
    setMode(next);
    applyTheme(next);
  }, []);

  const handleToggle = useCallback(() => {
    setMode((current) => {
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <button
      type="button"
      aria-pressed={mode === "dark"}
      aria-label="Przełącz motyw"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card/30 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-primary/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      onClick={handleToggle}
    >
      <span className="sr-only">Motyw {mode === "dark" ? "ciemny" : "jasny"}</span>
      <span className="hidden text-xs uppercase tracking-[0.35em] text-muted-foreground sm:inline">
        {mode === "dark" ? "ciemny" : "jasny"}
      </span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm transition">
        {mode === "dark" ? <Moon size={16} /> : <Sun size={16} />}
      </span>
    </button>
  );
}

