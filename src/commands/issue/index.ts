import { Command } from "commander";
import { createSubIssueCommand } from "./sub-issue";
import { createDependencyCommand } from "./dependency";

export function createIssueCommand(): Command {
  const command = new Command("issue");

  command.description("Manage GitHub issues");

  command.addCommand(createSubIssueCommand());
  command.addCommand(createDependencyCommand());

  return command;
}
