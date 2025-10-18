import { describe, test, expect } from "bun:test";
import { createReviewCommand } from "../../../src/commands/ai/review";

describe("review command", () => {
  test("should export createReviewCommand function", () => {
    expect(typeof createReviewCommand).toBe("function");
  });

  test("should create a command with correct name", () => {
    const cmd = createReviewCommand();
    expect(cmd.name()).toBe("review");
  });

  test("should have correct description", () => {
    const cmd = createReviewCommand();
    expect(cmd.description()).toContain("PleaseAI");
  });

  test("should have help text", () => {
    const cmd = createReviewCommand();
    const helpText = cmd.helpInformation();
    expect(helpText).toContain("review");
  });
});
