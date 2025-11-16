/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { POST } from "../login";
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
    request: new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    locals: {
      supabase: {
        auth: {
          signInWithPassword: vi.fn(),
        },
      },
    },
  };
};

describe("POST /api/auth/login", () => {
  describe("Walidacja danych wejściowych", () => {
    it("should reject invalid email format", async () => {
      const context = createMockContext({
        email: "invalid-email",
        password: "anypassword",
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        errorCode: "invalid_input",
        message: "Nieprawidłowe dane wejściowe.",
      });
      expect(data.details).toBeDefined();
      expect(data.details.email).toBeDefined();
    });

    it("should reject empty password", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "",
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

    it("should reject missing email field", async () => {
      const context = createMockContext({
        password: "anypassword",
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        errorCode: "invalid_input",
      });
      expect(data.details.email).toBeDefined();
    });

    it("should reject empty body", async () => {
      const context = createMockContext({});

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        success: false,
        errorCode: "invalid_input",
      });
    });
  });

  describe("Logika biznesowa - sukces", () => {
    it("should return 200 and user data on successful login", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
      });

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      if (!context.locals) throw new Error("locals is undefined");
      vi.mocked(context.locals.supabase.auth.signInWithPassword).mockResolvedValue({
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
            id: "user-123",
            email: "test@example.com",
          },
        },
      });
    });

    it("should handle user with null email", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: {
            id: "user-123",
            email: null,
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

  describe("Logika biznesowa - błędy", () => {
    it("should return 401 for invalid credentials", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "wrongpassword",
      });

      vi.mocked(context.locals!.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: createAuthApiError("Invalid login credentials"),
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        errorCode: "invalid_credentials",
        message: "Nieprawidłowy e-mail lub hasło.",
      });
    });

    it("should return 401 for unverified email", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: createAuthApiError("Email not confirmed"),
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        errorCode: "email_not_verified",
        message: "Adres e-mail nie został zweryfikowany. Sprawdź swoją skrzynkę pocztową.",
      });
    });

    it("should return 500 for rate limiting error", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: createAuthApiError("Too many requests", 429),
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(response.status).toBe(500);
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
      });

      vi.mocked(context.locals!.supabase.auth.signInWithPassword).mockResolvedValue({
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
              signInWithPassword: vi.fn(),
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
      });

      vi.mocked(context.locals!.supabase.auth.signInWithPassword).mockRejectedValue(new Error("Network error"));

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
      });

      vi.mocked(context.locals!.supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: "123", email: "test@example.com" },
          session: {} as any,
        },
        error: null,
      });

      const response = await POST(context as APIContext);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should have correct response structure on success", async () => {
      const context = createMockContext({
        email: "test@example.com",
        password: "Password123",
      });

      vi.mocked(context.locals!.supabase.auth.signInWithPassword).mockResolvedValue({
        data: {
          user: { id: "123", email: "test@example.com" },
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

    it("should have correct response structure on error", async () => {
      const context = createMockContext({
        email: "invalid",
        password: "",
      });

      const response = await POST(context as APIContext);
      const data = await response.json();

      expect(data).toHaveProperty("success", false);
      expect(data).toHaveProperty("errorCode");
      expect(data).toHaveProperty("message");
    });
  });
});
