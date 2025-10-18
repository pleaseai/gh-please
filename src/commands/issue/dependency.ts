import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import {
  addBlockedBy,
  getIssueNodeId,
  listBlockedBy,
  removeBlockedBy,
} from '../../lib/github-graphql'

/**
 * Creates a command to manage issue dependencies (blocked_by relationships)
 * @returns Command object with sub-commands (add, remove, list)
 */
export function createDependencyCommand(): Command {
  const command = new Command('dependency')

  command.description('Manage issue dependencies (blocked by relationships)')

  // Add subcommand
  const addCmd = new Command('add')
    .description('Add a blocking dependency to an issue')
    .argument('<issue>', 'Issue number that is blocked')
    .requiredOption('--blocked-by <blocker>', 'Issue number that blocks this issue')
    .action(async (issueStr: string, options: { blockedBy: string }) => {
      try {
        const issueNumber = Number.parseInt(issueStr, 10)
        const blockerNumber = Number.parseInt(options.blockedBy, 10)

        if (Number.isNaN(issueNumber) || Number.isNaN(blockerNumber)) {
          throw new TypeError('Issue numbers must be valid')
        }

        const { owner, repo } = await getRepoInfo()

        console.log(`🔍 Getting issue node IDs...`)
        const issueNodeId = await getIssueNodeId(owner, repo, issueNumber)
        const blockerNodeId = await getIssueNodeId(owner, repo, blockerNumber)

        console.log(
          `🔗 Setting #${blockerNumber} as blocker for #${issueNumber}...`,
        )
        await addBlockedBy(issueNodeId, blockerNodeId)

        console.log(`✅ Dependency added successfully!`)
        console.log(
          `   Issue #${issueNumber} is now blocked by #${blockerNumber}`,
        )
        console.log(
          `   Blocked: https://github.com/${owner}/${repo}/issues/${issueNumber}`,
        )
        console.log(
          `   Blocker: https://github.com/${owner}/${repo}/issues/${blockerNumber}`,
        )
      }
      catch (error) {
        console.error(
          `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
        process.exit(1)
      }
    })

  // Remove subcommand
  const removeCmd = new Command('remove')
    .description('Remove a blocking dependency from an issue')
    .argument('<issue>', 'Issue number that is blocked')
    .argument('<blocker>', 'Issue number that is no longer blocking')
    .action(async (issueStr: string, blockerStr: string) => {
      try {
        const issueNumber = Number.parseInt(issueStr, 10)
        const blockerNumber = Number.parseInt(blockerStr, 10)

        if (Number.isNaN(issueNumber) || Number.isNaN(blockerNumber)) {
          throw new TypeError('Issue numbers must be valid')
        }

        const { owner, repo } = await getRepoInfo()

        console.log(`🔍 Getting issue node IDs...`)
        const issueNodeId = await getIssueNodeId(owner, repo, issueNumber)
        const blockerNodeId = await getIssueNodeId(owner, repo, blockerNumber)

        console.log(
          `🔓 Removing #${blockerNumber} as blocker for #${issueNumber}...`,
        )
        await removeBlockedBy(issueNodeId, blockerNodeId)

        console.log(`✅ Dependency removed successfully!`)
        console.log(
          `   Issue #${issueNumber} is no longer blocked by #${blockerNumber}`,
        )
        console.log(
          `   Blocked: https://github.com/${owner}/${repo}/issues/${issueNumber}`,
        )
        console.log(
          `   Blocker: https://github.com/${owner}/${repo}/issues/${blockerNumber}`,
        )
      }
      catch (error) {
        console.error(
          `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
        process.exit(1)
      }
    })

  // List subcommand
  const listCmd = new Command('list')
    .description('List all issues blocking a given issue')
    .argument('<issue>', 'Issue number')
    .action(async (issueStr: string) => {
      try {
        const issueNumber = Number.parseInt(issueStr, 10)
        if (Number.isNaN(issueNumber)) {
          throw new TypeError('Issue number must be valid')
        }

        const { owner, repo } = await getRepoInfo()

        console.log(`📋 Fetching blockers for #${issueNumber}...`)
        const issueNodeId = await getIssueNodeId(owner, repo, issueNumber)
        const blockers = await listBlockedBy(issueNodeId)

        if (blockers.length === 0) {
          console.log(`✅ No blocking issues found for #${issueNumber}`)
          return
        }

        console.log(`\n⚠️  Issue #${issueNumber} is blocked by ${blockers.length} issue(s):\n`)
        for (const blocker of blockers) {
          const status = blocker.state === 'OPEN' ? '🔴' : '🟢'
          console.log(`${status} #${blocker.number}: ${blocker.title}`)
        }
        console.log(
          `\nView: https://github.com/${owner}/${repo}/issues/${issueNumber}`,
        )
      }
      catch (error) {
        console.error(
          `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        )
        process.exit(1)
      }
    })

  command.addCommand(addCmd)
  command.addCommand(removeCmd)
  command.addCommand(listCmd)

  return command
}
