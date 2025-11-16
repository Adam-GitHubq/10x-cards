/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { POST } from "../signup";
import type { APIContext } from "astro";

// Helper do tworzenia mock AuthApiError
const createAuthApiError = (message: string, status?: number): Error & { name: string; status?: number } => {
  const error = new Error(message) as Error & { name: string; status?: number };
  error.name = "AuthApiError";
  error.status = status;
  return error;
};

// Helper do tworzenia mock kontekstu Astro
const createMockContext = (body: unknown): Partial<APIContext> => {
  return {
    request: new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    locals: {
      supabase: {
        auth: {
          signUp: vi.fn(),
        },
      },
    } as any,
  };
};

describe("POST /api/auth/signup", () => {
  describe("Walidacja danych wejściowych", () => {
    it("should reject invalid email format", async () => {
      const context = createMockContext({
        email: "invalid-email",
        password: "Password123",
        confirmPassword: "Password123",
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        errorCode: "invalid_input",
        message: "Nieprawidłowe dane wejściowe.",
      });
      expect(data.details.email).toBeDefined();
    });

    it("should reject weak password (too short)", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Pass1",
        confirmPassword: "Pass1",
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        errorCode: "invalid_input",
      });
      expect(data.details.password).toBeDefined();
    });

    it("should reject password without letter", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "12345678",
        confirmPassword: "12345678",
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details.password).toBeDefined();
    });

    it("should reject password without digit", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password",
        confirmPassword: "Password",
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details.password).toBeDefined();
    });

    it("should reject mismatched passwords", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password456",
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        errorCode: "invalid_input",
      });
      expect(data.details.confirmPassword).toBeDefined();
      expect(data.details.confirmPassword).toContain("Hasła muszą być identyczne.");
    });

    it("should reject empty confirmPassword", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "",
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details.confirmPassword).toBeDefined();
    });

    it("should reject multiple invalid fields", async () => {
      const context = createMockContext({
        email: "invalid",
        password: "weak",
        confirmPassword: "different",
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.details.email).toBeDefined();
      expect(data.details.password).toBeDefined();
    });
  });

  describe("Logika biznesowa - sukces (weryfikacja email WYŁĄCZONA)", () => {
    it("should return 200 and user data on successful signup with auto-login", async () => {
      const context = createMockContext({
        email: "newuser@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      const mockUser = {
        id: "user-456",
        email: "newuser@example.com",
        identities: [{ id: "identity-1" }],
      };

      vi.mocked(context.locals!.supabase.auth.signUp).mockResolvedValue({
        data: {
          user: mockUser,
          session: {} as any,
        },
        error: null,
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          user: {
            id: "user-456",
            email: "newuser@example.com",
          },
        },
      });
    });

    it("should handle user with null email", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signUp).mockResolvedValue({
        data: {
          user: {
            id: "user-456",
            email: null,
            identities: [{ id: "identity-1" }],
          } as any,
          session: {} as any,
        },
        error: null,
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.user.email).toBeNull();
    });
  });

  describe("Logika biznesowa - weryfikacja email WŁĄCZONA", () => {
    it("should return requiresEmailVerification when identities array is empty", async () => {
      const context = createMockContext({
        email: "newuser@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signUp).mockResolvedValue({
        data: {
          user: {
            id: "user-456",
            email: "newuser@example.com",
            identities: [],
          },
          session: null,
        },
        error: null,
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          requiresEmailVerification: true,
        },
      });
    });

    it("should return requiresEmailVerification when user is null", async () => {
      const context = createMockContext({
        email: "newuser@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signUp).mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: null,
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: {
          requiresEmailVerification: true,
        },
      });
    });
  });

  describe("Logika biznesowa - błędy", () => {
    it("should return 409 for email already in use", async () => {
      const context = createMockContext({
        email: "existing@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: createAuthApiError("User already registered"),
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data).toEqual({
        success: false,
        errorCode: "email_in_use",
        message: "Konto z tym adresem e-mail już istnieje.",
      });
    });

    it("should return 400 for weak password from Supabase", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: createAuthApiError("Password should be at least 10 characters"),
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        errorCode: "invalid_input",
        message: "Hasło jest zbyt słabe. Użyj co najmniej 8 znaków z literą i cyfrą.",
      });
    });

    it("should return 429 for rate limiting error", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: createAuthApiError("Too many requests", 429),
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data).toEqual({
        success: false,
        errorCode: "rate_limited",
        message: "Zbyt wiele prób – spróbuj ponownie później.",
      });
    });

    it("should return 500 for unknown Supabase error", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: createAuthApiError("Some unknown error"),
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        errorCode: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      });
    });
  });

  describe("Obsługa nieoczekiwanych błędów", () => {
    it("should handle JSON parsing error", async () => {
      const context = {
        request: {
          json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        },
        locals: {
          supabase: {
            auth: {
              signUp: vi.fn(),
            },
          },
        },
      } as any;

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        errorCode: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      });
    });

    it("should handle Supabase client throwing error", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signUp).mockRejectedValue(new Error("Network error"));

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        errorCode: "unknown",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później.",
      });
    });
  });

  describe("Formatowanie odpowiedzi", () => {
    it("should return Content-Type: application/json header", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signUp).mockResolvedValue({
        data: {
          user: {
            id: "123",
            email: "test@example.com",
            identities: [{ id: "1" }],
          },
          session: {} as any,
        },
        error: null,
      });

      const response = await POST(context as APIContext);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should have correct response structure on success with user", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signUp).mockResolvedValue({
        data: {
          user: {
            id: "123",
            email: "test@example.com",
            identities: [{ id: "1" }],
          },
          session: {} as any,
        },
        error: null,
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("user");
      expect(data.data.user).toHaveProperty("id");
      expect(data.data.user).toHaveProperty("email");
    });

    it("should have correct response structure when email verification required", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signUp).mockResolvedValue({
        data: {
          user: null,
          session: null,
        },
        error: null,
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(data).toHaveProperty("success", true);
      expect(data).toHaveProperty("data");
      expect(data.data).toHaveProperty("requiresEmailVerification", true);
    });
  });
});
