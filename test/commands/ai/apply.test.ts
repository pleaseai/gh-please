import { describe, test, expect } from "bun:test";
import { createApplyCommand } from "../../../src/commands/ai/apply";

describe("apply command", () => {
  test("should export createApplyCommand function", () => {
    expect(typeof createApplyCommand).toBe("function");
  });

  test("should create a command with correct name", () => {
    const cmd = createApplyCommand();
    expect(cmd.name()).toBe("apply");
  });

  test("should have correct description", () => {
    const cmd = createApplyCommand();
    expect(cmd.description()).toContain("PleaseAI");
  });

  test("should have help text", () => {
    const cmd = createApplyCommand();
    const helpText = cmd.helpInformation();
    expect(helpText).toContain("apply");
  });
});
