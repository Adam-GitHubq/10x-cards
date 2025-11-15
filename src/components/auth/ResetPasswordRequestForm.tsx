import { useCallback, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { resetRequestSchema, type ResetRequestFormValues } from "@/lib/validation/authSchemas";

type ResetPasswordRequestFormProps = {
  onSuccess?: () => void;
};

type FormStatus = { type: "idle" } | { type: "success"; message: string } | { type: "error"; message: string };

const defaultValues: ResetRequestFormValues = {
  email: "",
};

export default function ResetPasswordRequestForm({ onSuccess }: ResetPasswordRequestFormProps) {
  const form = useForm<ResetRequestFormValues>({
    resolver: zodResolver(resetRequestSchema),
    defaultValues,
  });

  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const [isPending, startTransition] = useTransition();

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
    async (values: ResetRequestFormValues) => {
      setStatus({ type: "idle" });

      await new Promise((resolve) => setTimeout(resolve, 500));

      console.info("[Auth] Reset password request payload (mock)", values);

      startTransition(() => {
        setStatus({
          type: "success",
          message: "Jeśli konto istnieje, wyślemy wiadomość z linkiem do ustawienia nowego hasła.",
        });
        if (onSuccess) {
          onSuccess();
        }
      });
    },
    [onSuccess, startTransition]
  );

  return (
    <div className="space-y-6 rounded-2xl border border-border/40 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
      <Form {...form}>
        <form className="space-y-6" noValidate onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    inputMode="email"
                    autoComplete="email"
                    placeholder="jan.kowalski@example.com"
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Wysyłanie…" : "Wyślij instrukcje"}
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
