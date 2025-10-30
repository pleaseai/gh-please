import type { OutputFormat } from '@pleaseai/cli-toolkit/output'
import { isStructuredOutput, outputData, parseFields } from '@pleaseai/cli-toolkit/output'
import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import {
  addBlockedBy,
  getIssueNodeId,
  listBlockedBy,
  removeBlockedBy,
} from '../../lib/github-graphql'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'

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
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (issueStr: string, options: { blockedBy: string, repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const issueNumber = Number.parseInt(issueStr, 10)
        const blockerNumber = Number.parseInt(options.blockedBy, 10)

        if (Number.isNaN(issueNumber) || Number.isNaN(blockerNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        console.log(msg.gettingNodeIds)
        const issueNodeId = await getIssueNodeId(owner, repo, issueNumber)
        const blockerNodeId = await getIssueNodeId(owner, repo, blockerNumber)

        console.log(msg.settingBlocker(blockerNumber, issueNumber))
        await addBlockedBy(issueNodeId, blockerNodeId)

        console.log(msg.dependencyAdded)
        console.log(msg.issueBlockedBy(issueNumber, blockerNumber))
        console.log(
          `   ${msg.blocked}: https://github.com/${owner}/${repo}/issues/${issueNumber}`,
        )
        console.log(
          `   ${msg.blocker}: https://github.com/${owner}/${repo}/issues/${blockerNumber}`,
        )
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  // Remove subcommand
  const removeCmd = new Command('remove')
    .description('Remove a blocking dependency from an issue')
    .argument('<issue>', 'Issue number that is blocked')
    .argument('<blocker>', 'Issue number that is no longer blocking')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (issueStr: string, blockerStr: string, options: { repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const issueNumber = Number.parseInt(issueStr, 10)
        const blockerNumber = Number.parseInt(blockerStr, 10)

        if (Number.isNaN(issueNumber) || Number.isNaN(blockerNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        console.log(msg.gettingNodeIds)
        const issueNodeId = await getIssueNodeId(owner, repo, issueNumber)
        const blockerNodeId = await getIssueNodeId(owner, repo, blockerNumber)

        console.log(msg.removingBlocker(blockerNumber, issueNumber))
        await removeBlockedBy(issueNodeId, blockerNodeId)

        console.log(msg.dependencyRemoved)
        console.log(msg.issueNoLongerBlocked(issueNumber, blockerNumber))
        console.log(
          `   ${msg.blocked}: https://github.com/${owner}/${repo}/issues/${issueNumber}`,
        )
        console.log(
          `   ${msg.blocker}: https://github.com/${owner}/${repo}/issues/${blockerNumber}`,
        )
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  // List subcommand
  const listCmd = new Command('list')
    .description('List all issues blocking a given issue')
    .argument('<issue>', 'Issue number')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .option('--json [fields]', 'Output in JSON format with optional field selection (number,title,state,nodeId,url)')
    .option('--format <format>', 'Output format: json or toon')
    .action(async (issueStr: string, options: { repo?: string, json?: string | boolean, format?: OutputFormat }) => {
      // Determine output format
      const outputFormat: OutputFormat = options.format
        ? options.format
        : options.json !== undefined
          ? 'json'
          : 'toon'

      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const issueNumber = Number.parseInt(issueStr, 10)
        if (Number.isNaN(issueNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        // Determine output mode
        const shouldUseStructuredOutput = isStructuredOutput(options)

        // Show progress messages only for human-readable output
        if (!shouldUseStructuredOutput) {
          console.log(msg.fetchingBlockers(issueNumber))
        }

        // Fetch blocking issues
        const issueNodeId = await getIssueNodeId(owner, repo, issueNumber)
        const blockers = await listBlockedBy(issueNodeId)

        // Handle structured output (JSON or TOON)
        if (shouldUseStructuredOutput) {
          const fields = parseFields(options.json)
          const data = blockers.map(blocker => ({
            number: blocker.number,
            title: blocker.title,
            state: blocker.state,
            nodeId: blocker.nodeId,
            url: `https://github.com/${owner}/${repo}/issues/${blocker.number}`,
          }))
          outputData(data, outputFormat, fields)
          return
        }

        // Human-readable output
        if (blockers.length === 0) {
          console.log(msg.noBlockers(issueNumber))
          return
        }

        console.log(msg.issueBlockedByCount(issueNumber, blockers.length))
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
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  command.addCommand(addCmd)
  command.addCommand(removeCmd)
  command.addCommand(listCmd)

  return command
}
