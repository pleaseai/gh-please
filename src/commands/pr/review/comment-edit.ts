import { Command } from 'commander'
import { getRepoInfo } from '../../../lib/github-api'
import { updateReviewCommentByNodeId } from '../../../lib/github-graphql'
import { detectSystemLanguage, getCommentMessages } from '../../../lib/i18n'
import { toReviewCommentNodeId, validateCommentIdentifier } from '../../../lib/id-converter'

/**
 * Creates a command to edit PR review comments
 * @returns Command object configured for editing PR review comments
 */
export function createReviewCommentEditCommand(): Command {
  const command = new Command('edit')

  command
    .description('Edit a PR review comment')
    .argument('<comment-id>', 'Database ID (number) or Node ID (PRRC_...) of the review comment')
    .option('-b, --body <text>', 'New comment body text')
    .option('-F, --body-file <file>', 'Read body from file (use "-" for stdin)')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .option('--pr <number>', 'PR number (required when using Database ID with --repo)')
    .action(async (commentIdStr: string, options: { body?: string, bodyFile?: string, repo?: string, pr?: string }) => {
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
            console.error(msg.usagePr)
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
          console.error(msg.usagePr)
          process.exit(1)
        }

        // Get repository info and PR number
        const { owner, repo } = await getRepoInfo(options.repo)

        // Convert comment identifier to Node ID
        // For Database ID, we need PR number to fetch the comment list
        let commentNodeId: string

        if (commentIdentifier.startsWith('PRRC_')) {
          // Already a Node ID, use directly
          commentNodeId = commentIdentifier
          console.log(`✓ Node ID detected, using directly`)
        }
        else {
          // Database ID - need PR number to convert
          if (!options.pr) {
            throw new Error(
              'PR number is required when using Database ID. '
              + 'Use --pr <number> or provide Node ID instead.',
            )
          }

          const prNumber = Number.parseInt(options.pr, 10)
          if (Number.isNaN(prNumber)) {
            throw new TypeError('Invalid PR number')
          }

          console.log(`🔄 Converting Database ID to Node ID...`)
          commentNodeId = await toReviewCommentNodeId(
            commentIdentifier,
            owner,
            repo,
            prNumber,
          )
        }

        // Update comment using GraphQL
        const displayId = Number.parseInt(commentIdentifier, 10) || commentIdentifier
        console.log(msg.updatingComment(typeof displayId === 'number' ? displayId : 0))
        await updateReviewCommentByNodeId(commentNodeId, body)

        console.log(msg.commentUpdated)
        // Show URL (best effort - may not have PR number for Node ID input)
        if (options.pr) {
          const prNumber = Number.parseInt(options.pr, 10)
          const dbId = Number.parseInt(commentIdentifier, 10)
          if (!Number.isNaN(dbId)) {
            console.log(`   https://github.com/${owner}/${repo}/pull/${prNumber}#discussion_r${dbId}`)
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
