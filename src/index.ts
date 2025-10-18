#!/usr/bin/env bun

import { Command } from "commander";
import { createAiCommand } from "./commands/ai";
import { createIssueCommand } from "./commands/issue";
import { createPrCommand } from "./commands/pr";
import { createInitCommand } from "./commands/init";

const program = new Command();

program
  .name("gh-please")
  .description("GitHub CLI extension for managing pull requests and issues")
  .version("0.2.0");

// Add command groups
program.addCommand(createAiCommand());
program.addCommand(createIssueCommand());
program.addCommand(createPrCommand());
program.addCommand(createInitCommand());

// Deprecated: backward compatibility for review-reply
const deprecatedReviewReply = new Command("review-reply")
  .description("(Deprecated) Use 'gh please pr review-reply' instead")
  .argument("<comment-id>", "ID of the review comment to reply to")
  .option("-b, --body <text>", "Reply body text")
  .action(async (commentIdStr: string, options: { body?: string }) => {
    console.warn("⚠️  Warning: 'gh please review-reply' is deprecated.");
    console.warn("   Please use 'gh please pr review-reply' instead.");
    console.warn("");

    const { createReviewReplyCommand } = await import("./commands/pr/review-reply");
    const cmd = createReviewReplyCommand();
    // Pass the comment-id and body to the new command
    const args = [commentIdStr];
    if (options.body) {
      args.push("-b", options.body);
    }
    await cmd.parseAsync(args, { from: "user" });
  });

program.addCommand(deprecatedReviewReply);

// If no command provided, show help
if (process.argv.length <= 2) {
  program.help();
}

program.parse();
