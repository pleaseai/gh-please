import { Command } from "commander";
import { createReviewReplyCommand } from "./review-reply";
import { createResolveCommand } from "./resolve";

export function createPrCommand(): Command {
  const command = new Command("pr");

  command.description("Manage pull requests");

  command.addCommand(createReviewReplyCommand());
  command.addCommand(createResolveCommand());

  return command;
}
