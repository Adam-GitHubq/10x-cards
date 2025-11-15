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

type FormStatus = { type: "idle" } | { type: "success"; message: string } | { type: "error"; message: string };

const defaultValues: SignupFormValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
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
    async (values: SignupFormValues) => {
      setStatus({ type: "idle" });

      await new Promise((resolve) => setTimeout(resolve, 600));

      console.info("[Auth] Signup payload (mock)", values);

      startTransition(() => {
        setStatus({
          type: "success",
          message: "Formularz rejestracji został wstępnie wysłany – po podpięciu backendu nastąpi utworzenie konta.",
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
            {isSubmitting ? "Rejestrowanie…" : "Załóż konto"}
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
