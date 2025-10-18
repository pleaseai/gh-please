import { describe, test, expect } from "bun:test";
import { createSubIssueCommand } from "../../../src/commands/issue/sub-issue";

describe("sub-issue command", () => {
  test("should export createSubIssueCommand function", () => {
    expect(typeof createSubIssueCommand).toBe("function");
  });

  test("should create a command with correct name", () => {
    const cmd = createSubIssueCommand();
    expect(cmd.name()).toBe("sub-issue");
  });

  test("should have correct description", () => {
    const cmd = createSubIssueCommand();
    expect(cmd.description()).toContain("sub-issue");
  });

  test("should have create subcommand", () => {
    const cmd = createSubIssueCommand();
    const commands = cmd.commands || [];
    const createCmd = commands.find((c) => c.name() === "create");
    expect(createCmd).toBeDefined();
  });

  test("should have add subcommand", () => {
    const cmd = createSubIssueCommand();
    const commands = cmd.commands || [];
    const addCmd = commands.find((c) => c.name() === "add");
    expect(addCmd).toBeDefined();
  });

  test("should have remove subcommand", () => {
    const cmd = createSubIssueCommand();
    const commands = cmd.commands || [];
    const removeCmd = commands.find((c) => c.name() === "remove");
    expect(removeCmd).toBeDefined();
  });

  test("should have list subcommand", () => {
    const cmd = createSubIssueCommand();
    const commands = cmd.commands || [];
    const listCmd = commands.find((c) => c.name() === "list");
    expect(listCmd).toBeDefined();
  });
});
