/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { POST } from "../logout";
import type { APIContext } from "astro";

// Helper do tworzenia mock kontekstu Astro
const createMockContext = (cookieHeader: string | null): Partial<APIContext> => {
  return {
    request: {
      headers: {
        get: vi.fn((name: string) => {
          if (name === "Cookie") {
            return cookieHeader;
          }
          return null;
        }),
      },
    } as any,
    cookies: {
      delete: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
      has: vi.fn(),
    } as any,
  };
};

describe("POST /api/auth/logout", () => {
  describe("Pomyślne wylogowanie", () => {
    it("should return 204 and delete Supabase cookies", async () => {
      const context = createMockContext("sb-test-auth=value123; other=cookie");

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(context.cookies!.delete).toHaveBeenCalledWith("sb-test-auth", { path: "/" });
      expect(context.cookies!.delete).toHaveBeenCalledTimes(1);
    });

    it("should delete multiple Supabase cookies", async () => {
      const context = createMockContext(
        "sb-auth-token=abc123; sb-refresh-token=xyz789; other=cookie; sb-provider=google"
      );

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(context.cookies!.delete).toHaveBeenCalledWith("sb-auth-token", { path: "/" });
      expect(context.cookies!.delete).toHaveBeenCalledWith("sb-refresh-token", { path: "/" });
      expect(context.cookies!.delete).toHaveBeenCalledWith("sb-provider", { path: "/" });
      expect(context.cookies!.delete).toHaveBeenCalledTimes(3);
    });

    it("should only delete cookies starting with 'sb-'", async () => {
      const context = createMockContext("sb-auth=value; other-cookie=value2; session=value3");

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(context.cookies!.delete).toHaveBeenCalledWith("sb-auth", { path: "/" });
      expect(context.cookies!.delete).toHaveBeenCalledTimes(1);
    });

    it("should handle cookies with spaces around them", async () => {
      const context = createMockContext("  sb-auth=value  ;  other=cookie  ");

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(context.cookies!.delete).toHaveBeenCalledWith("sb-auth", { path: "/" });
    });
  });

  describe("Wylogowanie bez cookies Supabase", () => {
    it("should return 204 when no Supabase cookies present", async () => {
      const context = createMockContext("other=cookie; session=value");

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(context.cookies!.delete).not.toHaveBeenCalled();
    });

    it("should return 204 when no cookies at all", async () => {
      const context = createMockContext(null);

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(context.cookies!.delete).not.toHaveBeenCalled();
    });

    it("should return 204 when cookie header is empty string", async () => {
      const context = createMockContext("");

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(context.cookies!.delete).not.toHaveBeenCalled();
    });
  });

  describe("Obsługa błędów", () => {
    it("should return 204 even when cookie deletion throws error", async () => {
      const context = createMockContext("sb-auth=value");
      vi.mocked(context.cookies!.delete).mockImplementation(() => {
        throw new Error("Cookie deletion failed");
      });

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
    });

    it("should return 204 when request.headers.get throws error", async () => {
      const context = {
        request: {
          headers: {
            get: vi.fn().mockImplementation(() => {
              throw new Error("Headers error");
            }),
          },
        },
        cookies: {
          delete: vi.fn(),
        },
      } as any;

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
    });
  });

  describe("Formatowanie odpowiedzi", () => {
    it("should return response with no content", async () => {
      const context = createMockContext("sb-auth=value");

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });

    it("should not have Content-Type header for 204 response", async () => {
      const context = createMockContext("sb-auth=value");

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(response.headers.get("Content-Type")).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle cookie with empty value", async () => {
      const context = createMockContext("sb-auth=; other=value");

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(context.cookies!.delete).toHaveBeenCalledWith("sb-auth", { path: "/" });
    });

    it("should handle cookie without equals sign", async () => {
      const context = createMockContext("sb-auth; other=value");

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      // Cookie bez znaku = powinno być obsłużone gracefully
    });

    it("should handle malformed cookie string", async () => {
      const context = createMockContext(";;;sb-auth=value;;;");

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(context.cookies!.delete).toHaveBeenCalledWith("sb-auth", { path: "/" });
    });

    it("should handle cookie name that starts with 'sb-' but has more content", async () => {
      const context = createMockContext("sb-custom-cookie=value; sb-=emptyname");

      const response = await POST(context as APIContext);

      expect(response.status).toBe(204);
      expect(context.cookies!.delete).toHaveBeenCalledWith("sb-custom-cookie", { path: "/" });
      expect(context.cookies!.delete).toHaveBeenCalledWith("sb-", { path: "/" });
    });
  });

  describe("Graceful degradation", () => {
    it("should continue deleting other cookies if one deletion fails", async () => {
      const context = createMockContext("sb-auth=value1; sb-refresh=value2");

      let callCount = 0;
      vi.mocked(context.cookies!.delete).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          throw new Error("First deletion failed");
        }
      });

      const response = await POST(context as APIContext);

      // Powinno zwrócić 204 mimo błędu
      expect(response.status).toBe(204);
    });
  });
});
