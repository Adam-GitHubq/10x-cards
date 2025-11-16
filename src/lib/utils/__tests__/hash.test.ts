import { describe, expect, it } from "vitest";
import { computeMD5 } from "../hash";

describe("computeMD5", () => {
  describe("Hashowanie poprawnego tekstu", () => {
    it("should compute correct MD5 hash for 'Hello World'", async () => {
      const input = "Hello World";

      const result = await computeMD5(input);

      expect(result).toEqual({
        output: "b10a8db164e0754105b7a99be72e3fe5",
      });
    });

    it("should return hash as 32 character hex string", async () => {
      const input = "Test string";

      const result = await computeMD5(input);

      expect(result.output).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe("Hashowanie pustego stringa", () => {
    it("should throw error for empty string", async () => {
      const input = "";

      await expect(computeMD5(input)).rejects.toThrow("input cannot be empty");
    });
  });

  describe("Hashowanie długiego tekstu", () => {
    it("should compute hash for 10000 character string", async () => {
      const input = "A".repeat(10000);

      const result = await computeMD5(input);

      expect(result.output).toBeDefined();
      expect(result.output).toMatch(/^[a-f0-9]{32}$/);
    });

    it("should handle very long text efficiently", async () => {
      const input = "Lorem ipsum dolor sit amet ".repeat(1000);

      const startTime = Date.now();
      const result = await computeMD5(input);
      const endTime = Date.now();

      expect(result.output).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in less than 100ms
    });
  });

  describe("Hashowanie tekstu z polskimi znakami", () => {
    it("should correctly hash text with Polish characters (UTF-8)", async () => {
      const input = "Zażółć gęślą jaźń";

      const result = await computeMD5(input);

      expect(result).toEqual({
        output: "25af8716284fc8efbab13dbb3b517085",
      });
    });

    it("should handle various Unicode characters", async () => {
      const input = "Hello 世界 🌍 Привет";

      const result = await computeMD5(input);

      expect(result.output).toBeDefined();
      expect(result.output).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe("Walidacja typu wejścia", () => {
    it("should throw TypeError for number input", async () => {
      const input = 12345 as unknown as string;

      await expect(computeMD5(input)).rejects.toThrow(TypeError);
      await expect(computeMD5(input)).rejects.toThrow("input must be a string");
    });

    it("should throw TypeError for object input", async () => {
      const input = { text: "hello" } as unknown as string;

      await expect(computeMD5(input)).rejects.toThrow(TypeError);
      await expect(computeMD5(input)).rejects.toThrow("input must be a string");
    });

    it("should throw TypeError for null input", async () => {
      const input = null as unknown as string;

      await expect(computeMD5(input)).rejects.toThrow(TypeError);
      await expect(computeMD5(input)).rejects.toThrow("input must be a string");
    });

    it("should throw TypeError for undefined input", async () => {
      const input = undefined as unknown as string;

      await expect(computeMD5(input)).rejects.toThrow(TypeError);
      await expect(computeMD5(input)).rejects.toThrow("input must be a string");
    });

    it("should throw TypeError for array input", async () => {
      const input = ["hello", "world"] as unknown as string;

      await expect(computeMD5(input)).rejects.toThrow(TypeError);
      await expect(computeMD5(input)).rejects.toThrow("input must be a string");
    });

    it("should throw TypeError for boolean input", async () => {
      const input = true as unknown as string;

      await expect(computeMD5(input)).rejects.toThrow(TypeError);
      await expect(computeMD5(input)).rejects.toThrow("input must be a string");
    });
  });

  describe("Deterministyczność hashowania", () => {
    it("should return identical hashes for same input", async () => {
      const input = "Consistent input text";

      const result1 = await computeMD5(input);
      const result2 = await computeMD5(input);

      expect(result1.output).toBe(result2.output);
    });

    it("should return same hash across multiple calls", async () => {
      const input = "Test for consistency";
      const hashes: string[] = [];

      for (let i = 0; i < 5; i++) {
        const result = await computeMD5(input);
        hashes.push(result.output);
      }

      const allSame = hashes.every((hash) => hash === hashes[0]);
      expect(allSame).toBe(true);
    });
  });

  describe("Unikalne hasze dla różnych tekstów", () => {
    it("should return different hashes for different inputs", async () => {
      const input1 = "First text";
      const input2 = "Second text";

      const result1 = await computeMD5(input1);
      const result2 = await computeMD5(input2);

      expect(result1.output).not.toBe(result2.output);
    });

    it("should return different hashes for similar but not identical texts", async () => {
      const input1 = "Hello World";
      const input2 = "Hello World!";

      const result1 = await computeMD5(input1);
      const result2 = await computeMD5(input2);

      expect(result1.output).not.toBe(result2.output);
    });

    it("should be case-sensitive", async () => {
      const input1 = "hello";
      const input2 = "HELLO";

      const result1 = await computeMD5(input1);
      const result2 = await computeMD5(input2);

      expect(result1.output).not.toBe(result2.output);
    });
  });

  describe("Hashowanie specjalnych przypadków", () => {
    it("should handle single character", async () => {
      const input = "A";

      const result = await computeMD5(input);

      expect(result.output).toBeDefined();
      expect(result.output).toMatch(/^[a-f0-9]{32}$/);
    });

    it("should handle whitespace characters", async () => {
      const input = "   ";

      const result = await computeMD5(input);

      expect(result.output).toBeDefined();
      expect(result.output).toMatch(/^[a-f0-9]{32}$/);
    });

    it("should handle newlines and tabs", async () => {
      const input = "Line 1\nLine 2\tTabbed";

      const result = await computeMD5(input);

      expect(result.output).toBeDefined();
      expect(result.output).toMatch(/^[a-f0-9]{32}$/);
    });

    it("should handle special characters", async () => {
      const input = "!@#$%^&*()_+-=[]{}|;:',.<>?/~`";

      const result = await computeMD5(input);

      expect(result.output).toBeDefined();
      expect(result.output).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe("Struktura odpowiedzi", () => {
    it("should return object with 'output' property", async () => {
      const input = "Test";

      const result = await computeMD5(input);

      expect(result).toHaveProperty("output");
      expect(typeof result.output).toBe("string");
    });

    it("should not have additional properties", async () => {
      const input = "Test";

      const result = await computeMD5(input);

      const keys = Object.keys(result);
      expect(keys).toEqual(["output"]);
    });
  });
});
