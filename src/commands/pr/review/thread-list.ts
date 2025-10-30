import type { OutputFormat } from '../../../lib/json-output'
import { Command } from 'commander'
import { getRepoInfo } from '../../../lib/github-api'
import { getPrNodeId, listReviewThreads } from '../../../lib/github-graphql'
import { detectSystemLanguage, getPrMessages } from '../../../lib/i18n'
import { isStructuredOutput, outputData, parseFields } from '../../../lib/json-output'

/**
 * Creates a command to list review threads on pull requests
 * @returns Command object configured for listing threads
 */
export function createThreadListCommand(): Command {
  const command = new Command('list')

  command
    .description('List review threads on a pull request')
    .argument('<pr-number>', 'Pull request number')
    .option('--unresolved-only', 'Show only unresolved threads')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .option('--json [fields]', 'Output in JSON format with optional field selection (nodeId,isResolved,path,line,resolvedBy,firstCommentBody,url)')
    .option('--format <format>', 'Output format: json or toon')
    .action(
      async (
        prNumberStr: string,
        options: { unresolvedOnly?: boolean, repo?: string, json?: string | boolean, format?: OutputFormat },
      ) => {
        const lang = detectSystemLanguage()
        const msg = getPrMessages(lang)

        try {
          const prNumber = Number.parseInt(prNumberStr, 10)
          if (Number.isNaN(prNumber)) {
            throw new TypeError(msg.prNumberInvalid)
          }

          const { owner, repo } = await getRepoInfo(options.repo)
          const prNodeId = await getPrNodeId(owner, repo, prNumber)

          // Determine output mode
          const shouldUseStructuredOutput = isStructuredOutput(options)

          // Show progress messages only for human-readable output
          if (!shouldUseStructuredOutput) {
            console.log(msg.listingThreads(prNumber))
          }

          // Fetch review threads
          const threads = await listReviewThreads(prNodeId)
          const unresolvedThreads = threads.filter(t => !t.isResolved)
          const resolvedThreads = threads.filter(t => t.isResolved)

          // Handle structured output (JSON or TOON)
          if (shouldUseStructuredOutput) {
            const fields = parseFields(options.json)
            // Filter threads based on --unresolved-only flag
            const threadsToOutput = options.unresolvedOnly ? unresolvedThreads : threads
            const data = threadsToOutput.map(thread => ({
              nodeId: thread.nodeId,
              isResolved: thread.isResolved,
              path: thread.path,
              line: thread.line,
              resolvedBy: thread.resolvedBy || null,
              firstCommentBody: thread.firstCommentBody || null,
              url: `https://github.com/${owner}/${repo}/pull/${prNumber}#discussion_r${thread.firstCommentDatabaseId}`,
            }))
            outputData(data, options.format || 'json', fields)
            return
          }

          // Human-readable output
          if (threads.length === 0) {
            console.log(msg.noThreads)
            return
          }

          // Check for empty results with better messaging
          if (options.unresolvedOnly && unresolvedThreads.length === 0) {
            console.log(msg.noUnresolvedThreads)
            return
          }

          // Show summary
          console.log(`\n${msg.foundThreads(threads.length, resolvedThreads.length, unresolvedThreads.length)}\n`)

          // Show unresolved threads
          if (unresolvedThreads.length > 0) {
            if (!options.unresolvedOnly) {
              console.log(msg.unresolvedThreadsHeader(unresolvedThreads.length))
            }

            unresolvedThreads.forEach((thread, index) => {
              const location = msg.threadAtLocation(thread.path, thread.line)
              const commentPreview = thread.firstCommentBody
                ? `\n    💬 "${truncateComment(thread.firstCommentBody, 80)}"`
                : ''

              console.log(`  ✗ Thread ${index + 1}: ${location}`)
              console.log(`    Node ID: ${thread.nodeId}${commentPreview}`)
              console.log(`\n    # Resolve command:`)
              console.log(`    gh please pr review thread resolve ${prNumber} --thread ${thread.nodeId}\n`)
            })
          }

          // Show resolved threads (if not filtered)
          if (!options.unresolvedOnly && resolvedThreads.length > 0) {
            console.log(msg.resolvedThreadsHeader(resolvedThreads.length))
            resolvedThreads.forEach((thread, index) => {
              const location = msg.threadAtLocation(thread.path, thread.line)
              const resolvedByText = thread.resolvedBy
                ? ` (${msg.resolvedBy(thread.resolvedBy)})`
                : ''

              console.log(`  ✓ Thread ${index + 1}: ${location}${resolvedByText}`)
              console.log(`    Node ID: ${thread.nodeId}\n`)
            })
          }

          console.log(`${msg.viewPr} https://github.com/${owner}/${repo}/pull/${prNumber}`)
        }
        catch (error) {
          console.error(
            `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
          )
          process.exit(1)
        }
      },
    )

  return command
}

/**
 * Truncate comment body for display
 * @param text - Comment text
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
function truncateComment(text: string, maxLength: number): string {
  // Remove extra whitespace and newlines
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxLength) {
    return cleaned
  }
  return `${cleaned.slice(0, maxLength - 3)}...`
}
