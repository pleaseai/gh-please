import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import {
  getIssueNodeId,
  listIssueTypes,
  updateIssueType,
} from '../../lib/github-graphql'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'
import { filterFields, outputJson, parseFields } from '../../lib/json-output'

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
    .action(async (options: { repo?: string, json?: string | boolean }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const { owner, repo } = await getRepoInfo(options.repo)

        if (!options.json) {
          console.log(msg.fetchingIssueTypes)
        }

        const types = await listIssueTypes(owner, repo)

        if (types.length === 0) {
          if (!options.json) {
            console.log(msg.noIssueTypes)
          }
          else {
            outputJson([])
          }
          return
        }

        if (options.json) {
          const fields = typeof options.json === 'string' ? parseFields(options.json) : undefined
          const filtered = fields ? filterFields(types, fields) : types
          outputJson(filtered)
        }
        else {
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
          console.error(`${msg.errorPrefix}: ${msg.issueNumberInvalid}`)
          process.exit(1)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        // Require either type or typeId
        if (!options.type && !options.typeId) {
          console.error(msg.typeRequired)
          process.exit(1)
        }

        // Always fetch types to validate and get friendly names
        console.log(msg.fetchingIssueTypes)
        const types = await listIssueTypes(owner, repo)

        if (types.length === 0) {
          console.error(`❌ ${msg.noIssueTypes}`)
          process.exit(1)
        }

        // Find matching type by either Node ID or name
        const matchingType = options.typeId
          ? types.find(t => t.id === options.typeId)
          : types.find(t => t.name.toLowerCase() === options.type!.toLowerCase())

        if (!matchingType) {
          const identifier = options.typeId || options.type!
          console.error(`❌ ${msg.issueTypeNotFound(identifier)}`)
          if (options.type) {
            console.error(msg.availableTypes)
            for (const t of types) {
              console.error(`  - ${t.name}`)
            }
          }
          process.exit(1)
        }

        const issueTypeId = matchingType.id
        const issueTypeName = matchingType.name

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
          console.error(`${msg.errorPrefix}: ${msg.issueNumberInvalid}`)
          process.exit(1)
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
