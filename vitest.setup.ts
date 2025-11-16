import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Automatyczne czyszczenie po każdym teście
afterEach(() => {
  cleanup();
});

// Mockowanie globalnych obiektów jeśli potrzebne
global.ResizeObserver = class ResizeObserver {
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
};

// Mockowanie matchMedia dla testów wymagających media queries
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {
      // Mock implementation
    },
    removeListener: () => {
      // Mock implementation
    },
    addEventListener: () => {
      // Mock implementation
    },
    removeEventListener: () => {
      // Mock implementation
    },
    dispatchEvent: () => {
      // Mock implementation
    },
  }),
});
