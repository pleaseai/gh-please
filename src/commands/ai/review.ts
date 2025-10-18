import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import { triggerPleaseAIPr } from '../../lib/please-trigger'

/**
 * Creates a command to trigger PleaseAI code review for a pull request
 * @returns Command object configured for code review operations
 */
export function createReviewCommand(): Command {
  const command = new Command('review')

  command
    .description('Trigger PleaseAI to review a pull request')
    .argument('<pr-number>', 'Pull request number to review')
    .action(async (prNumberStr: string) => {
      try {
        const prNumber = Number.parseInt(prNumberStr, 10)
        if (isNaN(prNumber)) {
          throw new TypeError('PR number must be a valid number')
        }

        const { owner, repo } = await getRepoInfo()

        console.log(`🤖 Triggering PleaseAI review for PR #${prNumber}...`)
        await triggerPleaseAIPr('review', owner, repo, prNumber)
        console.log(`✅ Review request posted to PR #${prNumber}`)
        console.log(`   View: https://github.com/${owner}/${repo}/pull/${prNumber}`)
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
