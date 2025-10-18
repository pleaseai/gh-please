import { Command } from "commander";
import { getRepoInfo } from "../../lib/github-api";
import { triggerPleaseAIPr } from "../../lib/please-trigger";

/**
 * Creates a command to trigger PleaseAI to apply suggestions on a pull request
 * @returns Command object configured for applying suggestions
 */
export function createApplyCommand(): Command {
  const command = new Command("apply");

  command
    .description("Trigger PleaseAI to apply suggestions from a pull request")
    .argument("<pr-number>", "Pull request number to apply")
    .action(async (prNumberStr: string) => {
      try {
        const prNumber = parseInt(prNumberStr, 10);
        if (isNaN(prNumber)) {
          throw new Error("PR number must be a valid number");
        }

        const { owner, repo } = await getRepoInfo();

        console.log(`🤖 Triggering PleaseAI apply for PR #${prNumber}...`);
        await triggerPleaseAIPr("apply", owner, repo, prNumber);
        console.log(`✅ Apply request posted to PR #${prNumber}`);
        console.log(`   View: https://github.com/${owner}/${repo}/pull/${prNumber}`);
      } catch (error) {
        console.error(
          `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        process.exit(1);
      }
    });

  return command;
}
