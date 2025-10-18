import { Command } from "commander";
import { createTriageCommand } from "./triage";
import { createInvestigateCommand } from "./investigate";
import { createFixCommand } from "./fix";
import { createReviewCommand } from "./review";
import { createApplyCommand } from "./apply";

export function createAiCommand(): Command {
  const command = new Command("ai");

  command.description("Trigger PleaseAI workflows");

  command.addCommand(createTriageCommand());
  command.addCommand(createInvestigateCommand());
  command.addCommand(createFixCommand());
  command.addCommand(createReviewCommand());
  command.addCommand(createApplyCommand());

  return command;
}
