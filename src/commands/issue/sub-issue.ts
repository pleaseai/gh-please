import type { OutputFormat } from '@pleaseai/cli-toolkit/output'
import { isStructuredOutput, outputData, parseFields } from '@pleaseai/cli-toolkit/output'
import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import {
  addSubIssue,
  createIssueWithType,
  getIssueNodeId,
  listIssueTypes,
  listSubIssues,
  removeSubIssue,
} from '../../lib/github-graphql'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'
import { executeQuery } from '../../lib/jmespath-query'

/**
 * Creates a command to manage issue sub-issue relationships
 * @returns Command object with sub-commands (create, add, remove, list)
 */
export function createSubIssueCommand(): Command {
  const command = new Command('sub-issue')

  command.description('Manage sub-issues')

  // Create subcommand
  const createCmd = new Command('create')
    .description('Create a new sub-issue linked to a parent')
    .argument('<parent-issue>', 'Parent issue number')
    .requiredOption('--title <text>', 'Sub-issue title')
    .option('--body <text>', 'Sub-issue body')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .option('--type <name>', 'Issue type name (e.g., "Bug", "Feature")')
    .option('--type-id <id>', 'Issue type Node ID (direct)')
    .action(async (parentStr: string, options: { title: string, body?: string, repo?: string, type?: string, typeId?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const parentNumber = Number.parseInt(parentStr, 10)
        if (Number.isNaN(parentNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)
        console.log(msg.gettingParentIssue(parentNumber))

        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber)

        let issueTypeId: string | undefined
        let issueTypeName: string | undefined

        // Determine issue type ID (same logic as issue create command)
        if (options.typeId) {
          // Direct Node ID provided
          issueTypeId = options.typeId
        }
        else if (options.type) {
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

        // Create the sub-issue via GraphQL
        console.log(msg.creatingSubIssue)
        const result = await createIssueWithType(
          owner,
          repo,
          options.title,
          options.body,
          issueTypeId,
        )

        const childNumber = result.number
        const childNodeId = result.nodeId

        // Now link it as a sub-issue
        await addSubIssue(parentNodeId, childNodeId)

        // Show success message with type info if provided
        console.log(msg.subIssueCreatedLinked(childNumber, parentNumber))
        if (issueTypeName) {
          console.log(`   Type: ${issueTypeName}`)
        }
        console.log(
          `   View: https://github.com/${owner}/${repo}/issues/${childNumber}`,
        )
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  // Add subcommand
  const addCmd = new Command('add')
    .description('Add existing issue as sub-issue to parent')
    .argument('<parent-issue>', 'Parent issue number')
    .argument('<child-issue>', 'Child issue number to add as sub-issue')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (parentStr: string, childStr: string, options: { repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const parentNumber = Number.parseInt(parentStr, 10)
        const childNumber = Number.parseInt(childStr, 10)

        if (Number.isNaN(parentNumber) || Number.isNaN(childNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        console.log(msg.gettingNodeIds)
        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber)
        const childNodeId = await getIssueNodeId(owner, repo, childNumber)

        console.log(msg.linkingSubIssue(childNumber, parentNumber))
        await addSubIssue(parentNodeId, childNodeId)

        console.log(msg.subIssueLinked)
        console.log(
          `   ${msg.parent}: https://github.com/${owner}/${repo}/issues/${parentNumber}`,
        )
        console.log(
          `   ${msg.child}: https://github.com/${owner}/${repo}/issues/${childNumber}`,
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
    .description('Remove sub-issue from parent')
    .argument('<parent-issue>', 'Parent issue number')
    .argument('<child-issue>', 'Child issue number to remove')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (parentStr: string, childStr: string, options: { repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const parentNumber = Number.parseInt(parentStr, 10)
        const childNumber = Number.parseInt(childStr, 10)

        if (Number.isNaN(parentNumber) || Number.isNaN(childNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        console.log(msg.gettingNodeIds)
        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber)
        const childNodeId = await getIssueNodeId(owner, repo, childNumber)

        console.log(msg.unlinkingSubIssue(childNumber, parentNumber))
        await removeSubIssue(parentNodeId, childNodeId)

        console.log(msg.subIssueUnlinked)
        console.log(
          `   ${msg.parent}: https://github.com/${owner}/${repo}/issues/${parentNumber}`,
        )
        console.log(
          `   ${msg.child}: https://github.com/${owner}/${repo}/issues/${childNumber}`,
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
    .description('List all sub-issues of a parent issue')
    .argument('<parent-issue>', 'Parent issue number')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .option('--json [fields]', 'Output in JSON format with optional field selection (number,title,state,nodeId,url)')
    .option('--format <format>', 'Output format: json or toon')
    .option('--query <jmespath>', 'JMESPath query to filter results (e.g., "[?state==\'OPEN\'].{number:number,title:title}")')
    .action(async (parentStr: string, options: { repo?: string, json?: string | boolean, format?: OutputFormat, query?: string }) => {
      // Determine output format
      const outputFormat: OutputFormat = options.format
        ? options.format
        : options.json !== undefined
          ? 'json'
          : 'toon'

      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const parentNumber = Number.parseInt(parentStr, 10)
        if (Number.isNaN(parentNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        // Determine output mode
        const shouldUseStructuredOutput = isStructuredOutput(options)

        // Show progress messages only for human-readable output
        if (!shouldUseStructuredOutput) {
          console.log(msg.fetchingSubIssues(parentNumber))
        }

        // Fetch sub-issues
        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber)
        const subIssues = await listSubIssues(parentNodeId)

        // Handle structured output (JSON or TOON)
        if (shouldUseStructuredOutput) {
          const fields = parseFields(options.json)
          let data = subIssues.map(issue => ({
            number: issue.number,
            title: issue.title,
            state: issue.state,
            nodeId: issue.nodeId,
            url: `https://github.com/${owner}/${repo}/issues/${issue.number}`,
          }))

          // Apply JMESPath query if provided
          if (options.query) {
            try {
              data = executeQuery(data, options.query)
            }
            catch (error) {
              console.error(`${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`)
              process.exit(1)
            }
          }

          outputData(data, outputFormat, fields)
          return
        }

        // Human-readable output
        if (subIssues.length === 0) {
          console.log(msg.noSubIssues(parentNumber))
          return
        }

        console.log(msg.foundSubIssues(subIssues.length))
        for (const issue of subIssues) {
          const status = issue.state === 'OPEN' ? '🟢' : '🔴'
          console.log(`${status} #${issue.number}: ${issue.title}`)
        }
        console.log(
          `\nView: https://github.com/${owner}/${repo}/issues/${parentNumber}`,
        )
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  command.addCommand(createCmd)
  command.addCommand(addCmd)
  command.addCommand(removeCmd)
  command.addCommand(listCmd)

  return command
}
