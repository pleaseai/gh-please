import { Command } from "commander";
import { getRepoInfo } from "../../lib/github-api";
import {
  getIssueNodeId,
  addSubIssue,
  removeSubIssue,
  listSubIssues,
} from "../../lib/github-graphql";

export function createSubIssueCommand(): Command {
  const command = new Command("sub-issue");

  command.description("Manage sub-issues");

  // Create subcommand
  const createCmd = new Command("create")
    .description("Create a new sub-issue linked to a parent")
    .argument("<parent-issue>", "Parent issue number")
    .requiredOption("--title <text>", "Sub-issue title")
    .option("--body <text>", "Sub-issue body")
    .action(async (parentStr: string, options: { title: string; body?: string }) => {
      try {
        const parentNumber = parseInt(parentStr, 10);
        if (isNaN(parentNumber)) {
          throw new Error("Parent issue number must be valid");
        }

        const { owner, repo } = await getRepoInfo();
        console.log(`🔍 Getting parent issue #${parentNumber}...`);

        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber);

        console.log(`📝 Creating sub-issue...`);
        // Using GraphQL mutation to create issue with parent relationship
        const createMutation = `
          mutation($owner: String!, $repo: String!, $title: String!, $body: String, $parentId: ID!) {
            createIssue(input: {repositoryId: "", title: $title, body: $body}) {
              issue {
                id
                number
                title
              }
            }
          }
        `;

        // For now, create issue via gh CLI and then link it
        const proc = Bun.spawn(
          [
            "gh",
            "issue",
            "create",
            "-R",
            `${owner}/${repo}`,
            "-t",
            options.title,
            ...(options.body ? ["-b", options.body] : []),
          ],
          {
            stdout: "pipe",
            stderr: "pipe",
          }
        );

        const output = await new Response(proc.stdout).text();
        const exitCode = await proc.exited;

        if (exitCode !== 0) {
          const error = await new Response(proc.stderr).text();
          throw new Error(`Failed to create issue: ${error.trim()}`);
        }

        // Parse the issue number from the output URL
        const urlMatch = output.match(/\/issues\/(\d+)/);
        if (!urlMatch) {
          throw new Error("Failed to parse created issue number");
        }
        const childNumber = parseInt(urlMatch[1], 10);

        // Now link it as a sub-issue
        const childNodeId = await getIssueNodeId(owner, repo, childNumber);
        await addSubIssue(parentNodeId, childNodeId);

        console.log(`✅ Sub-issue #${childNumber} created and linked to #${parentNumber}!`);
        console.log(
          `   View: https://github.com/${owner}/${repo}/issues/${childNumber}`
        );
      } catch (error) {
        console.error(
          `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        process.exit(1);
      }
    });

  // Add subcommand
  const addCmd = new Command("add")
    .description("Add existing issue as sub-issue to parent")
    .argument("<parent-issue>", "Parent issue number")
    .argument("<child-issue>", "Child issue number to add as sub-issue")
    .action(async (parentStr: string, childStr: string) => {
      try {
        const parentNumber = parseInt(parentStr, 10);
        const childNumber = parseInt(childStr, 10);

        if (isNaN(parentNumber) || isNaN(childNumber)) {
          throw new Error("Issue numbers must be valid");
        }

        const { owner, repo } = await getRepoInfo();

        console.log(`🔍 Getting issue node IDs...`);
        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber);
        const childNodeId = await getIssueNodeId(owner, repo, childNumber);

        console.log(`🔗 Linking #${childNumber} as sub-issue of #${parentNumber}...`);
        await addSubIssue(parentNodeId, childNodeId);

        console.log(`✅ Sub-issue linked successfully!`);
        console.log(
          `   Parent: https://github.com/${owner}/${repo}/issues/${parentNumber}`
        );
        console.log(
          `   Child: https://github.com/${owner}/${repo}/issues/${childNumber}`
        );
      } catch (error) {
        console.error(
          `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        process.exit(1);
      }
    });

  // Remove subcommand
  const removeCmd = new Command("remove")
    .description("Remove sub-issue from parent")
    .argument("<parent-issue>", "Parent issue number")
    .argument("<child-issue>", "Child issue number to remove")
    .action(async (parentStr: string, childStr: string) => {
      try {
        const parentNumber = parseInt(parentStr, 10);
        const childNumber = parseInt(childStr, 10);

        if (isNaN(parentNumber) || isNaN(childNumber)) {
          throw new Error("Issue numbers must be valid");
        }

        const { owner, repo } = await getRepoInfo();

        console.log(`🔍 Getting issue node IDs...`);
        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber);
        const childNodeId = await getIssueNodeId(owner, repo, childNumber);

        console.log(`🔓 Unlinking #${childNumber} from #${parentNumber}...`);
        await removeSubIssue(parentNodeId, childNodeId);

        console.log(`✅ Sub-issue unlinked successfully!`);
        console.log(
          `   Parent: https://github.com/${owner}/${repo}/issues/${parentNumber}`
        );
        console.log(
          `   Child: https://github.com/${owner}/${repo}/issues/${childNumber}`
        );
      } catch (error) {
        console.error(
          `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        process.exit(1);
      }
    });

  // List subcommand
  const listCmd = new Command("list")
    .description("List all sub-issues of a parent issue")
    .argument("<parent-issue>", "Parent issue number")
    .action(async (parentStr: string) => {
      try {
        const parentNumber = parseInt(parentStr, 10);
        if (isNaN(parentNumber)) {
          throw new Error("Parent issue number must be valid");
        }

        const { owner, repo } = await getRepoInfo();

        console.log(`📋 Fetching sub-issues of #${parentNumber}...`);
        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber);
        const subIssues = await listSubIssues(parentNodeId);

        if (subIssues.length === 0) {
          console.log(`No sub-issues found for #${parentNumber}`);
          return;
        }

        console.log(`\n✅ Found ${subIssues.length} sub-issue(s):\n`);
        for (const issue of subIssues) {
          const status = issue.state === "OPEN" ? "🟢" : "🔴";
          console.log(`${status} #${issue.number}: ${issue.title}`);
        }
        console.log(
          `\nView: https://github.com/${owner}/${repo}/issues/${parentNumber}`
        );
      } catch (error) {
        console.error(
          `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        process.exit(1);
      }
    });

  command.addCommand(createCmd);
  command.addCommand(addCmd);
  command.addCommand(removeCmd);
  command.addCommand(listCmd);

  return command;
}
