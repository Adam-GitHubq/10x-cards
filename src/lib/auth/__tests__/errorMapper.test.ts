import { describe, expect, it } from "vitest";
import { mapLoginError, mapSignupError } from "../errorMapper";

// Helper do tworzenia mock AuthApiError
const createAuthApiError = (message: string, status?: number): Error & { name: string; status?: number } => {
  const error = new Error(message) as Error & { name: string; status?: number };
  error.name = "AuthApiError";
  error.status = status;
  return error;
};

describe("errorMapper", () => {
  describe("mapLoginError", () => {
    it("should map invalid login credentials error", () => {
      const error = createAuthApiError("Invalid login credentials");
      const result = mapLoginError(error);

      expect(result).toEqual({
        errorCode: "invalid_credentials",
        message: "Nieprawidłowy e-mail lub hasło.",
      });
    });

    it("should map email not confirmed error", () => {
      const error = createAuthApiError("Email not confirmed");
      const result = mapLoginError(error);

      expect(result).toEqual({
        errorCode: "email_not_verified",
        message: "Adres e-mail nie został zweryfikowany. Sprawdź swoją skrzynkę pocztową.",
      });
    });

    it("should map rate limiting error (status 429)", () => {
      const error = createAuthApiError("Too many requests", 429);
      const result = mapLoginError(error);

      expect(result).toEqual({
        errorCode: "rate_limited",
        message: "Zbyt wiele prób – spróbuj ponownie później.",
      });
    });

    it("should map unknown AuthApiError to default error", () => {
      const error = createAuthApiError("Some other error");
      const result = mapLoginError(error);

      expect(result).toEqual({
        errorCode: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      });
    });

    it("should map non-AuthApiError to default error", () => {
      const error = new Error("Network error");
      const result = mapLoginError(error);

      expect(result).toEqual({
        errorCode: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      });
    });

    it("should handle null error", () => {
      const result = mapLoginError(null);

      expect(result).toEqual({
        errorCode: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      });
    });

    it("should handle undefined error", () => {
      const result = mapLoginError(undefined);

      expect(result).toEqual({
        errorCode: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      });
    });
  });

  describe("mapSignupError", () => {
    it("should map user already registered error", () => {
      const error = createAuthApiError("User already registered");
      const result = mapSignupError(error);

      expect(result).toEqual({
        errorCode: "email_in_use",
        message: "Konto z tym adresem e-mail już istnieje.",
      });
    });

    it("should map weak password error", () => {
      const error = createAuthApiError("Password should be at least 8 characters");
      const result = mapSignupError(error);

      expect(result).toEqual({
        errorCode: "invalid_input",
        message: "Hasło jest zbyt słabe. Użyj co najmniej 8 znaków z literą i cyfrą.",
      });
    });

    it("should map rate limiting error (status 429)", () => {
      const error = createAuthApiError("Too many requests", 429);
      const result = mapSignupError(error);

      expect(result).toEqual({
        errorCode: "rate_limited",
        message: "Zbyt wiele prób – spróbuj ponownie później.",
      });
    });

    it("should map unknown AuthApiError to default error", () => {
      const error = createAuthApiError("Some other error");
      const result = mapSignupError(error);

      expect(result).toEqual({
        errorCode: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      });
    });

    it("should map non-AuthApiError to default error", () => {
      const error = new Error("Network error");
      const result = mapSignupError(error);

      expect(result).toEqual({
        errorCode: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      });
    });

    it("should handle null error", () => {
      const result = mapSignupError(null);

      expect(result).toEqual({
        errorCode: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      });
    });

    it("should handle undefined error", () => {
      const result = mapSignupError(undefined);

      expect(result).toEqual({
        errorCode: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      });
    });
  });
});
