import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { passwordHint, resetCompleteSchema, type ResetCompleteFormValues } from "@/lib/validation/authSchemas";

type ResetPasswordFormProps = {
  onSuccess?: () => void;
};

type FormStatus = { type: "idle" } | { type: "success"; message: string } | { type: "error"; message: string };

const defaultValues: ResetCompleteFormValues = {
  newPassword: "",
  confirmPassword: "",
};

export default function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const form = useForm<ResetCompleteFormValues>({
    resolver: zodResolver(resetCompleteSchema),
    defaultValues,
  });

  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const [isPending, startTransition] = useTransition();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const isSubmitting = form.formState.isSubmitting || isPending;

  const statusClasses = useMemo(() => {
    if (status.type === "success") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300";
    }

    if (status.type === "error") {
      return "border-destructive/30 bg-destructive/10 text-destructive-foreground dark:border-destructive/40 dark:bg-destructive/20";
    }

    return "";
  }, [status]);

  const handleSubmit = useCallback(
    async (values: ResetCompleteFormValues) => {
      setStatus({ type: "idle" });

      try {
        const response = await fetch("/api/auth/reset/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          startTransition(() => {
            setStatus({
              type: "error",
              message: data.message || "Nie udało się zmienić hasła. Spróbuj ponownie.",
            });
          });
          return;
        }

        startTransition(() => {
          setStatus({
            type: "success",
            message: "Hasło zostało zmienione. Za chwilę zostaniesz przekierowany do logowania.",
          });
          setShouldRedirect(true);

          if (onSuccess) {
            onSuccess();
          }
        });
      } catch {
        startTransition(() => {
          setStatus({
            type: "error",
            message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
          });
        });
      }
    },
    [onSuccess, startTransition]
  );

  // Effect do przekierowania po sukcesie
  useEffect(() => {
    if (shouldRedirect) {
      const timer = setTimeout(() => {
        window.location.href = "/auth/login?reset=success";
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [shouldRedirect]);

  return (
    <div className="space-y-6 rounded-2xl border border-border/40 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
      <Form {...form}>
        <form className="space-y-6" noValidate onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nowe hasło</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormDescription>{passwordHint}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Potwierdź hasło</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Zapisywanie…" : "Ustaw nowe hasło"}
          </Button>
        </form>
      </Form>
      {status.type !== "idle" ? (
        <div
          role="status"
          className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed transition", statusClasses)}
        >
          {status.message}
        </div>
      ) : null}
      <p className="text-center text-sm text-muted-foreground">
        Pamiętasz hasło?{" "}
        <a
          href="/auth/login"
          className="font-semibold text-primary transition hover:text-primary/80 focus-visible:underline"
        >
          Wróć do logowania
        </a>
      </p>
    </div>
  );
}
