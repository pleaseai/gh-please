import { describe, test, expect } from "bun:test";
import { validateCommentId, validateReplyBody } from "../../src/lib/validation";

describe("validation", () => {
  describe("validateCommentId", () => {
    test("should validate positive integers", () => {
      expect(validateCommentId("123")).toBe(123);
      expect(validateCommentId("999999")).toBe(999999);
      expect(validateCommentId("1")).toBe(1);
    });

    test("should reject non-numeric values", () => {
      expect(() => validateCommentId("abc")).toThrow("Comment ID must be a positive integer");
      expect(() => validateCommentId("")).toThrow("Comment ID must be a positive integer");
      expect(() => validateCommentId("12.34")).toThrow("Comment ID must be a positive integer");
    });

    test("should reject negative numbers and zero", () => {
      expect(() => validateCommentId("-1")).toThrow("Comment ID must be a positive integer");
      expect(() => validateCommentId("0")).toThrow("Comment ID must be a positive integer");
      expect(() => validateCommentId("-999")).toThrow("Comment ID must be a positive integer");
    });
  });

  describe("validateReplyBody", () => {
    test("should accept non-empty strings", () => {
      expect(validateReplyBody("Hello")).toBe("Hello");
      expect(validateReplyBody("Multi line\nreply")).toBe("Multi line\nreply");
      expect(validateReplyBody("  Trimmed  ")).toBe("Trimmed");
    });

    test("should trim whitespace", () => {
      expect(validateReplyBody("  spaces  ")).toBe("spaces");
      expect(validateReplyBody("\n\ntext\n\n")).toBe("text");
      expect(validateReplyBody("\tTabbed\t")).toBe("Tabbed");
    });

    test("should reject empty or whitespace-only strings", () => {
      expect(() => validateReplyBody("")).toThrow("Reply body cannot be empty");
      expect(() => validateReplyBody("   ")).toThrow("Reply body cannot be empty");
      expect(() => validateReplyBody("\n\n\n")).toThrow("Reply body cannot be empty");
      expect(() => validateReplyBody(undefined)).toThrow("Reply body cannot be empty");
    });
  });
});
