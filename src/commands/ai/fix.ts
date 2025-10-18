import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import { triggerPleaseAIIssue } from '../../lib/please-trigger'

/**
 * Creates a command to trigger PleaseAI fix workflow for an issue
 * @returns Command object configured for fix operations
 */
export function createFixCommand(): Command {
  const command = new Command('fix')

  command
    .description('Trigger PleaseAI to create a fix for an issue')
    .argument('<issue-number>', 'Issue number to fix')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (issueNumberStr: string, options: { repo?: string }) => {
      try {
        const issueNumber = Number.parseInt(issueNumberStr, 10)
        if (Number.isNaN(issueNumber)) {
          throw new TypeError('Issue number must be a valid number')
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        console.log(`🤖 Triggering PleaseAI fix for issue #${issueNumber}...`)
        await triggerPleaseAIIssue('fix', owner, repo, issueNumber)
        console.log(`✅ Fix request posted to issue #${issueNumber}`)
        console.log(`   View: https://github.com/${owner}/${repo}/issues/${issueNumber}`)
      }
      catch (error) {
        console.error(
          `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
        process.exit(1)
      }
    })

  return command
}
