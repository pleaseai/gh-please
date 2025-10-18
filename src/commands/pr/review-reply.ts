import { Command } from 'commander'
import { createReviewReply, getCurrentPrInfo, getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getPrMessages } from '../../lib/i18n'
import { validateCommentId, validateReplyBody } from '../../lib/validation'

/**
 * Creates a command to reply to PR review comments
 * @returns Command object configured for creating review replies
 */
export function createReviewReplyCommand(): Command {
  const command = new Command('review-reply')

  command
    .description('Create a reply to a PR review comment')
    .argument('<comment-id>', 'ID of the review comment to reply to')
    .option('-b, --body <text>', 'Reply body text')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format (required if not in PR context)')
    .option('--pr <number>', 'PR number (required with --repo)')
    .action(async (commentIdStr: string, options: { body?: string, repo?: string, pr?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getPrMessages(lang)

      try {
        // Validate comment ID
        const commentId = validateCommentId(commentIdStr)

        let body = options.body

        // If no body provided, read from stdin
        if (!body) {
          if (process.stdin.isTTY) {
            console.error(msg.bodyRequired)
            console.error(msg.usage)
            process.exit(1)
          }

          // Read from stdin (pipe)
          const chunks: Buffer[] = []
          for await (const chunk of process.stdin) {
            chunks.push(chunk)
          }
          body = Buffer.concat(chunks).toString('utf-8')
        }

        // Validate body
        body = validateReplyBody(body)

        console.log(msg.fetchingPrInfo)

        let prInfo
        if (options.repo && options.pr) {
          // Use provided repo and PR number
          const { owner, repo } = await getRepoInfo(options.repo)
          const prNumber = Number.parseInt(options.pr, 10)
          if (Number.isNaN(prNumber)) {
            throw new TypeError(msg.prNumberInvalid)
          }
          prInfo = { owner, repo, number: prNumber }
        } else if (options.repo || options.pr) {
          throw new Error(msg.bothRepoAndPr)
        } else {
          // Get from current PR context
          prInfo = await getCurrentPrInfo()
        }

        console.log(msg.creatingReply(commentId, prInfo.number))
        await createReviewReply({
          commentId,
          body,
          prInfo,
        })
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
