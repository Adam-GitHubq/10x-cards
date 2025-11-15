import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        style: {
          fontSize: "0.95rem",
        },
      }}
    />
  );
}
