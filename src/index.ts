#!/usr/bin/env bun

import { Command } from "commander";
import { createReviewReplyCommand } from "./commands/review-reply";

const program = new Command();

program
  .name("gh-please")
  .description("GitHub CLI extension for managing pull requests")
  .version("0.1.0");

// Add commands
program.addCommand(createReviewReplyCommand());

// If no command provided, show help
if (process.argv.length <= 2) {
  program.help();
}

program.parse();
