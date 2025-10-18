import { Command } from "commander";
import { getRepoInfo } from "../../lib/github-api";
import { triggerPleaseAIIssue } from "../../lib/please-trigger";

export function createTriageCommand(): Command {
  const command = new Command("triage");

  command
    .description("Trigger PleaseAI to triage an issue")
    .argument("<issue-number>", "Issue number to triage")
    .action(async (issueNumberStr: string) => {
      try {
        const issueNumber = parseInt(issueNumberStr, 10);
        if (isNaN(issueNumber)) {
          throw new Error("Issue number must be a valid number");
        }

        const { owner, repo } = await getRepoInfo();

        console.log(`🤖 Triggering PleaseAI triage for issue #${issueNumber}...`);
        await triggerPleaseAIIssue("triage", owner, repo, issueNumber);
        console.log(`✅ Triage request posted to issue #${issueNumber}`);
        console.log(`   View: https://github.com/${owner}/${repo}/issues/${issueNumber}`);
      } catch (error) {
        console.error(
          `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        process.exit(1);
      }
    });

  return command;
}
