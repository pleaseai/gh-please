import { Command } from 'commander'
import { updateIssueCommentByNodeId } from '../../lib/github'
import { getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getCommentMessages } from '../../lib/i18n'
import { toIssueCommentNodeId, validateCommentIdentifier } from '../../lib/id-converter'

/**
 * Creates a command to edit issue comments
 * @returns Command object configured for editing issue comments
 */
export function createIssueCommentEditCommand(): Command {
  const command = new Command('edit')

  command
    .description('Edit an issue comment')
    .argument('<comment-id>', 'Database ID (number) or Node ID (IC_...) of the issue comment')
    .option('-b, --body <text>', 'New comment body text')
    .option('-F, --body-file <file>', 'Read body from file (use "-" for stdin)')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .option('--issue <number>', 'Issue number (required when using Database ID with --repo)')
    .action(async (commentIdStr: string, options: { body?: string, bodyFile?: string, repo?: string, issue?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getCommentMessages(lang)

      try {
        // Validate comment identifier (Database ID or Node ID)
        const commentIdentifier = validateCommentIdentifier(commentIdStr)

        let body = options.body

        // Handle --body-file option
        if (options.bodyFile) {
          if (options.bodyFile === '-') {
            // Read from stdin
            const chunks: Buffer[] = []
            for await (const chunk of process.stdin) {
              chunks.push(chunk)
            }
            body = Buffer.concat(chunks).toString('utf-8').trim()
          }
          else {
            // Read from file
            const file = Bun.file(options.bodyFile)
            body = (await file.text()).trim()
          }
        }

        // Validate body is provided
        if (!body) {
          if (process.stdin.isTTY) {
            console.error(msg.bodyRequired)
            console.error(msg.usageIssue)
            process.exit(1)
          }

          // Read from stdin (pipe)
          const chunks: Buffer[] = []
          for await (const chunk of process.stdin) {
            chunks.push(chunk)
          }
          body = Buffer.concat(chunks).toString('utf-8').trim()
        }

        // Validate body is not empty
        if (!body) {
          console.error(msg.bodyEmpty)
          console.error(msg.usageIssue)
          process.exit(1)
        }

        // Get repository info and issue number
        const { owner, repo } = await getRepoInfo(options.repo)

        // Convert comment identifier to Node ID
        // For Database ID, we need issue number to fetch the comment list
        let commentNodeId: string

        if (commentIdentifier.startsWith('IC_')) {
          // Already a Node ID, use directly
          commentNodeId = commentIdentifier
          console.log(`✓ Node ID detected, using directly`)
        }
        else {
          // Database ID - need issue number to convert
          if (!options.issue) {
            throw new Error(
              'Issue number is required when using Database ID. '
              + 'Use --issue <number> or provide Node ID instead.',
            )
          }

          const issueNumber = Number.parseInt(options.issue, 10)
          if (Number.isNaN(issueNumber)) {
            throw new TypeError('Invalid issue number')
          }

          console.log(`🔄 Converting Database ID to Node ID...`)
          commentNodeId = await toIssueCommentNodeId(
            commentIdentifier,
            owner,
            repo,
            issueNumber,
          )
        }

        // Update comment using GraphQL
        const displayId = Number.parseInt(commentIdentifier, 10)
        if (!Number.isNaN(displayId)) {
          console.log(msg.updatingComment(displayId))
        }
        else {
          console.log(`🔄 Updating comment ${commentIdentifier}...`)
        }
        await updateIssueCommentByNodeId(commentNodeId, body)

        console.log(msg.commentUpdated)
        // Show URL (best effort - may not have issue number for Node ID input)
        if (options.issue) {
          const issueNumber = Number.parseInt(options.issue, 10)
          const dbId = Number.parseInt(commentIdentifier, 10)
          if (!Number.isNaN(dbId)) {
            console.log(`   https://github.com/${owner}/${repo}/issues/${issueNumber}#issuecomment-${dbId}`)
          }
        }
      }
      catch (error) {
        if (error instanceof Error) {
          console.error(`${msg.errorPrefix}: ${error.message}`)
        }
        else {
          console.error(msg.unknownError)
        }
        process.exit(1)
      }
    })

  return command
}
