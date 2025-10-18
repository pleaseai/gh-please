import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import { triggerPleaseAIIssue } from '../../lib/please-trigger'

/**
 * Creates a command to trigger PleaseAI investigation for an issue
 * @returns Command object configured for investigation operations
 */
export function createInvestigateCommand(): Command {
  const command = new Command('investigate')

  command
    .description('Trigger PleaseAI to investigate an issue')
    .argument('<issue-number>', 'Issue number to investigate')
    .action(async (issueNumberStr: string) => {
      try {
        const issueNumber = Number.parseInt(issueNumberStr, 10)
        if (isNaN(issueNumber)) {
          throw new TypeError('Issue number must be a valid number')
        }

        const { owner, repo } = await getRepoInfo()

        console.log(`🤖 Triggering PleaseAI investigation for issue #${issueNumber}...`)
        await triggerPleaseAIIssue('investigate', owner, repo, issueNumber)
        console.log(`✅ Investigation request posted to issue #${issueNumber}`)
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
