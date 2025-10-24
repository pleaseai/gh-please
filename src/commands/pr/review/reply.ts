import { Command } from 'commander'
import { getCurrentPrInfo, getRepoInfo } from '../../../lib/github-api'
import { createReviewCommentReply } from '../../../lib/github-graphql'
import { detectSystemLanguage, getPrMessages } from '../../../lib/i18n'
import { toReviewCommentNodeId, validateCommentIdentifier } from '../../../lib/id-converter'
import { validateReplyBody } from '../../../lib/validation'

/**
 * Creates a command to reply to PR review comments
 * @returns Command object configured for creating review replies
 */
export function createReviewReplyCommand(): Command {
  const command = new Command('reply')

  command
    .description('Create a reply to a PR review comment')
    .argument('<comment-id>', 'Database ID (number) or Node ID (PRRC_...) of the review comment')
    .option('-b, --body <text>', 'Reply body text')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format (required if not in PR context)')
    .option('--pr <number>', 'PR number (required with --repo)')
    .action(async (commentIdStr: string, options: { body?: string, repo?: string, pr?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getPrMessages(lang)

      try {
        // Validate comment identifier (Database ID or Node ID)
        const commentIdentifier = validateCommentIdentifier(commentIdStr)

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
        }
        else if (options.repo || options.pr) {
          throw new Error(msg.bothRepoAndPr)
        }
        else {
          // Get from current PR context
          prInfo = await getCurrentPrInfo()
        }

        // Convert comment identifier to Node ID (supports both Database ID and Node ID)
        console.log(`🔄 Converting comment identifier to Node ID...`)
        const commentNodeId = await toReviewCommentNodeId(
          commentIdentifier,
          prInfo.owner,
          prInfo.repo,
          prInfo.number,
        )

        // For display purposes, show original identifier
        const displayId = Number.parseInt(commentIdentifier, 10)
        if (!Number.isNaN(displayId)) {
          console.log(msg.creatingReply(displayId, prInfo.number))
        }
        else {
          console.log(`🔄 Creating reply to comment ${commentIdentifier} on PR #${prInfo.number}...`)
        }

        // Create reply using GraphQL (supports all comment types including general comments)
        const result = await createReviewCommentReply(commentNodeId, body)

        console.log(`✅ Reply created successfully!`)
        console.log(`   Comment ID: ${result.databaseId}`)
        console.log(`   Node ID: ${result.nodeId}`)
        console.log(`   View: ${result.url}`)
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
