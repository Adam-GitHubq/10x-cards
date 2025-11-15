import { z } from "zod";

const emailSchema = z
  .string({ required_error: "Adres e-mail jest wymagany." })
  .trim()
  .min(1, "Adres e-mail jest wymagany.")
  .max(254, "Adres e-mail jest zbyt długi.")
  .email("Podaj prawidłowy adres e-mail.");

const basePasswordSchema = z
  .string({ required_error: "Hasło jest wymagane." })
  .min(8, "Hasło musi mieć co najmniej 8 znaków.")
  .regex(/[A-Za-z]/, "Hasło musi zawierać przynajmniej jedną literę.")
  .regex(/\d/, "Hasło musi zawierać przynajmniej jedną cyfrę.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ required_error: "Hasło jest wymagane." }).min(1, "Hasło jest wymagane."),
});

export const signupSchema = z
  .object({
    email: emailSchema,
    password: basePasswordSchema,
    confirmPassword: z.string({ required_error: "Potwierdź hasło." }).min(1, "Potwierdź hasło."),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Hasła muszą być identyczne.",
      });
    }
  });

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export const resetCompleteSchema = z
  .object({
    newPassword: basePasswordSchema,
    confirmPassword: z.string({ required_error: "Potwierdź hasło." }).min(1, "Potwierdź hasło."),
  })
  .superRefine(({ newPassword, confirmPassword }, ctx) => {
    if (newPassword !== confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Hasła muszą być identyczne.",
      });
    }
  });

export const deleteAccountSchema = z.object({
  currentPassword: z.string({ required_error: "Hasło jest wymagane." }).min(1, "Hasło jest wymagane."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ResetRequestFormValues = z.infer<typeof resetRequestSchema>;
export type ResetCompleteFormValues = z.infer<typeof resetCompleteSchema>;
export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;

export const passwordHint = "Minimum 8 znaków, z co najmniej jedną literą i cyfrą.";
