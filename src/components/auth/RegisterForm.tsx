import { useCallback, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { passwordHint, signupSchema, type SignupFormValues } from "@/lib/validation/authSchemas";

type RegisterFormProps = {
  onSuccess?: () => void;
};

type FormStatus =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | { type: "email_verification"; message: string };

const defaultValues: SignupFormValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterForm({ onSuccess: _onSuccess }: RegisterFormProps) {
  // onSuccess prop is reserved for future use
  void _onSuccess;
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues,
  });

  const [status, setStatus] = useState<FormStatus>({ type: "idle" });
  const [isPending, startTransition] = useTransition();

  const isSubmitting = form.formState.isSubmitting || isPending;

  const statusClasses = useMemo(() => {
    if (status.type === "success" || status.type === "email_verification") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300";
    }

    if (status.type === "error") {
      return "border-destructive/30 bg-destructive/10 text-destructive-foreground dark:border-destructive/40 dark:bg-destructive/20";
    }

    return "";
  }, [status]);

  const handleSubmit = useCallback(
    async (values: SignupFormValues) => {
      setStatus({ type: "idle" });

      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          // Błąd rejestracji
          setStatus({
            type: "error",
            message: data.message || "Nie udało się utworzyć konta. Spróbuj ponownie.",
          });
          return;
        }

        // Sprawdź czy wymagana jest weryfikacja email
        if (data.data.requiresEmailVerification) {
          setStatus({
            type: "email_verification",
            message:
              "Sprawdź swoją skrzynkę e-mail! Wysłaliśmy wiadomość z linkiem aktywacyjnym. Kliknij w link, aby dokończyć rejestrację.",
          });
          return;
        }

        // Sukces - użytkownik jest automatycznie zalogowany (weryfikacja email wyłączona)
        startTransition(() => {
          setStatus({
            type: "success",
            message: "Konto zostało utworzone! Przekierowywanie...",
          });

          // Przekieruj do generatora fiszek
          setTimeout(() => {
            window.location.assign("/generate");
          }, 500);
        });
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("[Auth] Signup error:", error);
        setStatus({
          type: "error",
          message: "Wystąpił błąd połączenia. Sprawdź połączenie internetowe i spróbuj ponownie.",
        });
      }
    },
    [startTransition]
  );

  return (
    <div className="space-y-6 rounded-2xl border border-border/40 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
      <Form {...form}>
        <form className="space-y-6" noValidate onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-5">
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hasło</FormLabel>
                  <FormControl>
                    <Input {...field} type="password" autoComplete="new-password" disabled={isSubmitting} />
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
                    <Input {...field} type="password" autoComplete="new-password" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Tworzenie konta…" : "Załóż konto"}
          </Button>
        </form>
      </Form>
      {status.type !== "idle" ? (
        <div
          role="status"
          className={cn("rounded-xl border px-4 py-3 text-sm leading-relaxed transition", statusClasses)}
        >
          {status.message}
          {status.type === "email_verification" && (
            <div className="mt-3">
              <a
                href="/auth/login"
                className="font-semibold text-emerald-700 underline transition hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
              >
                Przejdź do logowania
              </a>
            </div>
          )}
        </div>
      ) : null}
      <p className="text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <a
          href="/auth/login"
          className="font-semibold text-primary transition hover:text-primary/80 focus-visible:underline"
        >
          Zaloguj się
        </a>
      </p>
    </div>
  );
}
