import type { OutputFormat } from '@pleaseai/cli-toolkit/output'
import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import {
  getIssueNodeId,
  listIssueTypes,
  updateIssueType,
} from '../../lib/github-graphql'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'
import { isStructuredOutput, outputData, parseFields } from '@pleaseai/cli-toolkit/output'

/**
 * Creates a command group for issue type management
 * @returns Command object with subcommands (list, set, remove)
 */
export function createIssueTypeCommand(): Command {
  const command = new Command('type')

  command.description('Manage issue types')

  // List subcommand
  const listCmd = new Command('list')
    .description('List all issue types for a repository')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .option('--json [fields]', 'Output as JSON with optional field selection (id, name, description, color, isEnabled)')
    .option('--format <format>', 'Output format: json or toon')
    .action(async (options: { repo?: string, json?: string | boolean, format?: OutputFormat }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const { owner, repo } = await getRepoInfo(options.repo)

        // Determine output mode
        const shouldUseStructuredOutput = isStructuredOutput(options)

        // Show progress messages only for human-readable output
        if (!shouldUseStructuredOutput) {
          console.log(msg.fetchingIssueTypes)
        }

        // Fetch issue types
        const types = await listIssueTypes(owner, repo)

        // Handle empty results
        if (types.length === 0) {
          if (shouldUseStructuredOutput) {
            outputData([], options.format || 'json')
          }
          else {
            console.log(msg.noIssueTypes)
          }
          return
        }

        // Handle structured output (JSON or TOON)
        if (shouldUseStructuredOutput) {
          const fields = parseFields(options.json)
          outputData(types, options.format || 'json', fields)
        }
        else {
          // Human-readable output
          console.log(`\n📋 Available issue types (${types.length}):\n`)
          for (const type of types) {
            const enabled = type.isEnabled ? '✓' : '✗'
            const desc = type.description ? ` - ${type.description}` : ''
            console.log(`  ${enabled} ${type.name} (${type.color})${desc}`)
          }
        }
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  // Set subcommand
  const setCmd = new Command('set')
    .description('Set the issue type for an issue')
    .argument('<issue-number>', 'Issue number')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .option('--type <name>', 'Issue type name')
    .option('--type-id <id>', 'Issue type Node ID (direct)')
    .action(async (issueStr: string, options: { repo?: string, type?: string, typeId?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const issueNumber = Number.parseInt(issueStr, 10)
        if (Number.isNaN(issueNumber) || issueNumber <= 0) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        // Require either type or typeId
        if (!options.type && !options.typeId) {
          console.error(msg.typeRequired)
          process.exit(1)
        }

        let issueTypeId: string
        let issueTypeName: string

        if (options.typeId) {
          // Direct Node ID provided
          issueTypeId = options.typeId
          issueTypeName = options.typeId // Fallback to ID if name unknown
        }
        else {
          // Type name provided - need to look it up
          console.log(msg.fetchingIssueTypes)

          const types = await listIssueTypes(owner, repo)

          if (types.length === 0) {
            console.error(`❌ ${msg.noIssueTypes}`)
            process.exit(1)
          }

          const matchingType = types.find(
            t => t.name.toLowerCase() === options.type!.toLowerCase(),
          )

          if (!matchingType) {
            console.error(`❌ ${msg.issueTypeNotFound(options.type!)}`)
            console.error(`\nAvailable types:`)
            for (const t of types) {
              console.error(`  - ${t.name}`)
            }
            process.exit(1)
          }

          issueTypeId = matchingType.id
          issueTypeName = matchingType.name
        }

        // Get issue Node ID
        const issueNodeId = await getIssueNodeId(owner, repo, issueNumber)

        console.log(msg.settingIssueType(issueNumber, issueTypeName))
        await updateIssueType(issueNodeId, issueTypeId)

        console.log(msg.issueTypeSet)
        console.log(`   View: https://github.com/${owner}/${repo}/issues/${issueNumber}`)
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
    .description('Remove the issue type from an issue')
    .argument('<issue-number>', 'Issue number')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (issueStr: string, options: { repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const issueNumber = Number.parseInt(issueStr, 10)
        if (Number.isNaN(issueNumber) || issueNumber <= 0) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        // Get issue Node ID
        const issueNodeId = await getIssueNodeId(owner, repo, issueNumber)

        console.log(msg.removingIssueType(issueNumber))
        await updateIssueType(issueNodeId, null) // null to clear

        console.log(msg.issueTypeRemoved)
        console.log(`   View: https://github.com/${owner}/${repo}/issues/${issueNumber}`)
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  command.addCommand(listCmd)
  command.addCommand(setCmd)
  command.addCommand(removeCmd)

  return command
}
