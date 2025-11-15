import { useCallback, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { loginSchema, type LoginFormValues } from "@/lib/validation/authSchemas";

type LoginFormProps = {
  onSuccess?: () => void;
};

type FormStatus = { type: "idle" } | { type: "success"; message: string } | { type: "error"; message: string };

const defaultValues: LoginFormValues = {
  email: "",
  password: "",
};

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
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
    async (values: LoginFormValues) => {
      setStatus({ type: "idle" });

      await new Promise((resolve) => setTimeout(resolve, 500));

      console.info("[Auth] Login payload (mock)", values);

      startTransition(() => {
        setStatus({
          type: "success",
          message: "Formularz logowania został wysłany – integracja z API zostanie dodana później.",
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
                  <div className="flex items-center justify-between text-sm">
                    <FormLabel>Hasło</FormLabel>
                    <a
                      className="font-medium text-primary transition hover:text-primary/80 focus-visible:underline"
                      href="/auth/reset"
                    >
                      Zapomniałeś hasła?
                    </a>
                  </div>
                  <FormControl>
                    <Input {...field} type="password" autoComplete="current-password" disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button className="w-full" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Logowanie…" : "Zaloguj się"}
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
        Nie masz konta?{" "}
        <a
          href="/auth/register"
          className="font-semibold text-primary transition hover:text-primary/80 focus-visible:underline"
        >
          Załóż konto
        </a>
      </p>
    </div>
  );
}
