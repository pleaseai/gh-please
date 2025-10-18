import { describe, test, expect } from "bun:test";
import { createReviewReplyCommand } from "../../../src/commands/pr/review-reply";

describe("review-reply command", () => {
  test("should export createReviewReplyCommand function", () => {
    expect(typeof createReviewReplyCommand).toBe("function");
  });

  test("should create a command with correct name", () => {
    const cmd = createReviewReplyCommand();
    expect(cmd.name()).toBe("review-reply");
  });

  test("should have correct description", () => {
    const cmd = createReviewReplyCommand();
    expect(cmd.description()).toContain("PR review comment");
  });

  test("should accept comment-id argument", () => {
    const cmd = createReviewReplyCommand();
    const usage = cmd.usage() || "";
    expect(usage).toContain("comment-id");
  });

  test("should have body option", () => {
    const cmd = createReviewReplyCommand();
    const options = cmd.options || [];
    const bodyOption = options.find((o) => o.short === "-b");
    expect(bodyOption).toBeDefined();
  });
});
