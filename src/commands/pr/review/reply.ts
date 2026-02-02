import { Command } from 'commander'
import { createReviewCommentReply, getPrNodeId } from '../../../lib/github'
import { getCurrentPrInfo, getRepoInfo } from '../../../lib/github-api'
import { detectSystemLanguage, getPrMessages } from '../../../lib/i18n'
import { isDatabaseId, isNodeId, isThreadNodeId } from '../../../lib/id-converter'
import { validateReplyBody } from '../../../lib/validation'

/**
 * Creates a command to reply to PR review threads
 * @returns Command object configured for creating review replies
 */
export function createReviewReplyCommand(): Command {
  const command = new Command('reply')

  command
    .description('Create a reply to a PR review thread')
    .argument('<id>', 'Thread ID (PRRT_...), Comment ID (PRRC_...), or Database ID (number)')
    .option('-b, --body <text>', 'Reply body text')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format (required if not in PR context)')
    .option('--pr <number>', 'PR number (required with --repo)')
    .action(async (idStr: string, options: { body?: string, repo?: string, pr?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getPrMessages(lang)

      try {
        // Validate identifier format
        const identifier = idStr.trim()
        if (!isThreadNodeId(identifier) && !isNodeId(identifier) && !isDatabaseId(identifier)) {
          throw new Error(
            `Invalid identifier: "${identifier}". `
            + 'Expected Thread ID (PRRT_...), Comment ID (PRRC_...), or Database ID (positive integer)',
          )
        }

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

        // Get PR Node ID for the createReviewCommentReply function
        const prNodeId = await getPrNodeId(prInfo.owner, prInfo.repo, prInfo.number)

        // Show progress based on identifier type
        if (isThreadNodeId(identifier)) {
          console.log(`🔄 Creating reply to thread ${identifier} on PR #${prInfo.number}...`)
        }
        else {
          const displayId = Number.parseInt(identifier, 10)
          if (!Number.isNaN(displayId)) {
            console.log(msg.creatingReply(displayId, prInfo.number))
          }
          else {
            console.log(`🔄 Creating reply to comment ${identifier} on PR #${prInfo.number}...`)
          }
        }

        // Create reply using GraphQL
        // - Thread ID (PRRT_...): used directly, no additional API call
        // - Comment ID or Database ID: finds thread via reviewThreads query
        const result = await createReviewCommentReply(identifier, body, prNodeId)

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
