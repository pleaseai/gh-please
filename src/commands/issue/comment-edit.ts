import { Command } from 'commander'
import { getIssueComment, updateIssueComment } from '../../lib/comment-api'
import { getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getCommentMessages } from '../../lib/i18n'
import { validateCommentId } from '../../lib/validation'

/**
 * Creates a command to edit issue comments
 * @returns Command object configured for editing issue comments
 */
export function createIssueCommentEditCommand(): Command {
  const command = new Command('edit')

  command
    .description('Edit an issue comment')
    .argument('<comment-id>', 'ID of the issue comment to edit')
    .option('-b, --body <text>', 'New comment body text')
    .option('-F, --body-file <file>', 'Read body from file (use "-" for stdin)')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (commentIdStr: string, options: { body?: string, bodyFile?: string, repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getCommentMessages(lang)

      try {
        // Validate comment ID
        const commentId = validateCommentId(commentIdStr)

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

        // Get repository info
        const { owner, repo } = await getRepoInfo(options.repo)

        // Fetch current comment (for verification)
        console.log(msg.fetchingComment(commentId))
        await getIssueComment(owner, repo, commentId)

        // Update comment
        console.log(msg.updatingComment(commentId))
        await updateIssueComment(owner, repo, commentId, body)

        console.log(msg.commentUpdated)
        console.log(`   https://github.com/${owner}/${repo}/issues#issuecomment-${commentId}`)
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
