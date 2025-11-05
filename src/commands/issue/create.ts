import { filterFields, outputJson, parseFields } from '@pleaseai/cli-toolkit/output'
import { Command } from 'commander'
import {
  addSubIssue,
  createIssueWithType,
  getAssigneeNodeIds,
  getIssueNodeId,
  getLabelNodeIds,
  getMilestoneNodeId,
  getProjectNodeIds,
  listIssueTypes,
} from '../../lib/github'
import { getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'

interface IssueTemplate {
  name: string
  body: string
}

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
    .option('-l, --label <name>', 'Add label (can be used multiple times)', (value, previous: string[] = []) => [...previous, value], [])
    .option('-a, --assignee <login>', 'Add assignee (can be used multiple times)', (value, previous: string[] = []) => [...previous, value], [])
    .option('-m, --milestone <name>', 'Add to milestone')
    .option('-p, --project <title>', 'Add to project (can be used multiple times)', (value, previous: string[] = []) => [...previous, value], [])
    .option('--parent <number>', 'Parent issue number (creates sub-issue relationship)')
    .option('-F, --body-file <path>', 'Read issue body from file ("-" for stdin)')
    .option('-t, --template <name>', 'Use issue template')
    .option('--json [fields]', 'Output as JSON with optional field selection (number, title, url, type)')
    .action(async (options: {
      title: string
      body?: string
      repo?: string
      type?: string
      typeId?: string
      label?: string[]
      assignee?: string[]
      milestone?: string
      project?: string[]
      parent?: string
      bodyFile?: string
      template?: string
      json?: string | boolean
    }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        // Parse repository information
        const { owner, repo } = await getRepoInfo(options.repo)

        // Handle body sources: --body, --body-file, or --template
        let issueBody = options.body

        if (options.bodyFile && options.template) {
          throw new TypeError('Cannot specify both --body-file and --template')
        }

        if (options.body && (options.bodyFile || options.template)) {
          throw new TypeError('Cannot specify --body with --body-file or --template')
        }

        if (options.bodyFile) {
          if (options.bodyFile === '-') {
            // Read from stdin
            try {
              issueBody = await Bun.stdin.text()

              if (!issueBody || issueBody.trim().length === 0) {
                throw new Error('stdin is empty or contains only whitespace')
              }
            }
            catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error)
              throw new Error(
                `Failed to read issue body from stdin.\n`
                + `Error: ${errorMessage}\n`
                + `\n`
                + `Possible reasons:\n`
                + `  • stdin is not available or has been closed\n`
                + `  • The input contains invalid UTF-8 encoding\n`
                + `  • The pipe was broken or interrupted\n`
                + `\n`
                + `Usage: echo "body text" | gh please issue create --title "..." --body-file -`,
              )
            }
          }
          else {
            // Read from file
            const file = Bun.file(options.bodyFile)
            if (!(await file.exists())) {
              throw new Error(`File not found: ${options.bodyFile}`)
            }

            try {
              issueBody = await file.text()
            }
            catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error)
              throw new Error(
                `Failed to read file: ${options.bodyFile}\n`
                + `Error: ${errorMessage}\n`
                + `\n`
                + `Possible reasons:\n`
                + `  • The file cannot be read due to permissions\n`
                + `  • The file contains invalid UTF-8 encoding\n`
                + `  • The file is locked by another process\n`
                + `  • A disk read error occurred\n`
                + `\n`
                + `Please check file permissions and encoding, then try again.`,
              )
            }
          }
        }
        else if (options.template) {
          // Use gh CLI to fetch template content
          const proc = Bun.spawn([
            'gh',
            'api',
            `/repos/${owner}/${repo}/issues/templates`,
          ], {
            stdout: 'pipe',
            stderr: 'pipe',
          })

          const stdout = await new Response(proc.stdout).text()
          const stderr = await new Response(proc.stderr).text()
          const exitCode = await proc.exited

          if (exitCode !== 0) {
            const errorMsg = stderr.includes('404')
              ? `No issue templates found in ${owner}/${repo}.\n`
              + `Make sure the repository has templates in .github/ISSUE_TEMPLATE/`
              : `Failed to fetch issue templates: ${stderr}`
            throw new Error(errorMsg)
          }

          let templates: IssueTemplate[]
          try {
            templates = JSON.parse(stdout)

            if (!Array.isArray(templates)) {
              throw new TypeError('Expected array of templates')
            }
          }
          catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error)
            throw new Error(
              `Failed to parse issue templates response from GitHub.\n`
              + `Error: ${errorMessage}\n`
              + `Response preview: ${stdout.substring(0, 200)}${stdout.length > 200 ? '...' : ''}\n`
              + `\n`
              + `This is likely a GitHub API issue. Please try again later.`,
            )
          }

          const template = templates.find(t => t.name === options.template)

          if (!template) {
            const availableTemplates = templates.map(t => t.name).join(', ')
            throw new Error(
              `Template "${options.template}" not found.\n${
                availableTemplates
                  ? `Available templates: ${availableTemplates}`
                  : 'No templates available'}`,
            )
          }

          issueBody = template.body
        }

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

        // Get label Node IDs if labels are provided
        let labelIds: string[] | undefined
        if (options.label && options.label.length > 0) {
          if (!options.json) {
            console.log(`🏷️  Looking up label IDs...`)
          }
          labelIds = await getLabelNodeIds(owner, repo, options.label)
        }

        // Get assignee Node IDs if assignees are provided
        let assigneeIds: string[] | undefined
        if (options.assignee && options.assignee.length > 0) {
          if (!options.json) {
            console.log(`👤 Looking up assignee IDs...`)
          }
          assigneeIds = await getAssigneeNodeIds(owner, repo, options.assignee)
        }

        // Get milestone Node ID if milestone is provided
        let milestoneId: string | undefined
        if (options.milestone) {
          if (!options.json) {
            console.log(`🎯 Looking up milestone ID...`)
          }
          milestoneId = await getMilestoneNodeId(owner, repo, options.milestone)
        }

        // Get project Node IDs if projects are provided
        let projectIds: string[] | undefined
        if (options.project && options.project.length > 0) {
          if (!options.json) {
            console.log(`📋 Looking up project IDs...`)
          }
          projectIds = await getProjectNodeIds(owner, repo, options.project)
        }

        // Create the issue
        if (!options.json) {
          console.log(msg.creatingIssue)
        }

        const result = await createIssueWithType(
          owner,
          repo,
          options.title,
          issueBody,
          issueTypeId,
          labelIds,
          assigneeIds,
          milestoneId,
          projectIds,
        )

        // Link to parent issue if specified
        if (options.parent) {
          const parentNumber = Number.parseInt(options.parent, 10)
          if (Number.isNaN(parentNumber)) {
            throw new TypeError(`Invalid parent issue number: ${options.parent}`)
          }

          if (!options.json) {
            console.log(`🔗 Linking to parent issue #${parentNumber}...`)
          }

          const parentNodeId = await getIssueNodeId(owner, repo, parentNumber)
          await addSubIssue(parentNodeId, result.nodeId)

          if (!options.json) {
            console.log(`✓ Linked as sub-issue of #${parentNumber}`)
          }
        }

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
