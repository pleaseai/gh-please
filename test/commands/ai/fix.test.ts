import { describe, test, expect } from "bun:test";
import { createFixCommand } from "../../../src/commands/ai/fix";

describe("fix command", () => {
  test("should export createFixCommand function", () => {
    expect(typeof createFixCommand).toBe("function");
  });

  test("should create a command with correct name", () => {
    const cmd = createFixCommand();
    expect(cmd.name()).toBe("fix");
  });

  test("should have correct description", () => {
    const cmd = createFixCommand();
    expect(cmd.description()).toContain("PleaseAI");
  });

  test("should have help text", () => {
    const cmd = createFixCommand();
    const helpText = cmd.helpInformation();
    expect(helpText).toContain("fix");
  });
});
