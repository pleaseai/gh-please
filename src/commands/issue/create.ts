import { filterFields, outputJson, parseFields } from '@pleaseai/cli-toolkit/output'
import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import {
  createIssueWithType,
  listIssueTypes,
} from '../../lib/github-graphql'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'

/**
 * Creates a command to create GitHub issues with optional issue type
 * @returns Command object for issue creation
 */
export function createIssueCreateCommand(): Command {
  const command = new Command('create')

  command
    .description('Create a new issue with optional issue type')
    .requiredOption('--title <text>', 'Issue title')
    .option('--body <text>', 'Issue body')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .option('--type <name>', 'Issue type name (e.g., "Bug", "Feature")')
    .option('--type-id <id>', 'Issue type Node ID (direct)')
    .option('--json [fields]', 'Output as JSON with optional field selection (number, title, url, type)')
    .action(async (options: {
      title: string
      body?: string
      repo?: string
      type?: string
      typeId?: string
      json?: string | boolean
    }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        // Parse repository information
        const { owner, repo } = await getRepoInfo(options.repo)

        let issueTypeId: string | undefined
        let issueTypeName: string | undefined

        // Determine issue type ID
        if (options.typeId) {
          // Direct Node ID provided
          issueTypeId = options.typeId
        }
        else if (options.type) {
          // Type name provided - need to look it up
          if (!options.json) {
            console.log(msg.fetchingIssueTypes)
          }

          const types = await listIssueTypes(owner, repo)

          if (types.length === 0) {
            console.error(`❌ ${msg.noIssueTypes}`)
            process.exit(1)
          }

          const matchingType = types.find(
            t => t.name.toLowerCase() === options.type!.toLowerCase(),
          )

          if (!matchingType) {
            console.error(`❌ ${msg.issueTypeNotFound(options.type)}`)
            console.error(msg.availableTypes)
            for (const t of types) {
              console.error(`  - ${t.name}`)
            }
            process.exit(1)
          }

          issueTypeId = matchingType.id
          issueTypeName = matchingType.name
        }

        // Create the issue
        if (!options.json) {
          console.log(msg.creatingIssue)
        }

        const result = await createIssueWithType(
          owner,
          repo,
          options.title,
          options.body,
          issueTypeId,
        )

        // Output result
        if (options.json) {
          const issueData = {
            number: result.number,
            title: options.title,
            url: `https://github.com/${owner}/${repo}/issues/${result.number}`,
            type: issueTypeName || null,
          }

          const fields = typeof options.json === 'string' ? parseFields(options.json) : undefined
          const filtered = fields ? filterFields(issueData, fields) : issueData
          outputJson(filtered)
        }
        else {
          console.log(msg.issueCreated(result.number, issueTypeName))
          console.log(`   View: https://github.com/${owner}/${repo}/issues/${result.number}`)
        }
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  return command
}
