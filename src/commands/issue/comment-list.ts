import type { OutputFormat } from '@pleaseai/cli-toolkit/output'
import type { CommentInfo } from '../../types'
import { isStructuredOutput, outputData, parseFields } from '@pleaseai/cli-toolkit/output'
import { Command } from 'commander'
import { listIssueComments } from '../../lib/comment-api'
import { getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getCommentMessages } from '../../lib/i18n'
import { applyQuery } from '../../lib/jmespath-query'

const BODY_PREVIEW_LENGTH = 80

/**
 * Format a comment for display
 */
function formatComment(comment: CommentInfo): string {
  const lines = []
  lines.push(`  ID: ${comment.id}`)
  lines.push(`  Author: ${comment.user.login}`)
  lines.push(`  Created: ${new Date(comment.created_at).toLocaleString()}`)
  if (comment.updated_at !== comment.created_at) {
    lines.push(`  Updated: ${new Date(comment.updated_at).toLocaleString()}`)
  }
  lines.push(`  URL: ${comment.html_url}`)

  // Truncate body preview to max length
  const firstLine = comment.body.split('\n')[0] || ''
  const preview = firstLine.length > BODY_PREVIEW_LENGTH
    ? `${firstLine.substring(0, BODY_PREVIEW_LENGTH - 3)}...`
    : firstLine
  const hasMoreLines = comment.body.includes('\n')
  lines.push(`  Body: ${preview}${hasMoreLines && firstLine.length <= BODY_PREVIEW_LENGTH ? '...' : ''}`)

  return lines.join('\n')
}

/**
 * Creates a command to list issue comments
 * @returns Command object configured for listing issue comments
 */
export function createIssueCommentListCommand(): Command {
  const command = new Command('list')

  command
    .description('List all comments for an issue')
    .argument('<issue-number>', 'Issue number')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .option('--json [fields]', 'Output in JSON format with optional field selection (id,body,author,createdAt,updatedAt,url)')
    .option('--format <format>', 'Output format: json or toon')
    .option('--query <jmespath>', 'JMESPath query to filter results (e.g., "[?author==\'username\'].{id:id,body:body}")')
    .action(async (issueNumberStr: string, options: { repo?: string, json?: string | boolean, format?: OutputFormat, query?: string }) => {
      // Determine output format
      const outputFormat: OutputFormat = options.format
        ? options.format
        : options.json !== undefined
          ? 'json'
          : 'toon'

      const lang = detectSystemLanguage()
      const msg = getCommentMessages(lang)

      try {
        // Parse issue number
        const issueNumber = Number.parseInt(issueNumberStr, 10)
        if (Number.isNaN(issueNumber) || issueNumber <= 0) {
          console.error(`${msg.errorPrefix}: ${msg.invalidIssueNumber}`)
          process.exit(1)
        }

        // Get repository info
        const { owner, repo } = await getRepoInfo(options.repo)

        // Determine output mode
        const shouldUseStructuredOutput = isStructuredOutput(options)

        // Fetch comments (no progress messages in structured output mode)
        if (!shouldUseStructuredOutput) {
          console.log(msg.listingIssueComments(issueNumber))
        }
        const comments = await listIssueComments(owner, repo, issueNumber)

        // Handle structured output (JSON or TOON)
        if (shouldUseStructuredOutput) {
          const fields = parseFields(options.json)
          let data = comments.map(comment => ({
            id: comment.id,
            body: comment.body,
            author: comment.user.login,
            createdAt: comment.created_at,
            updatedAt: comment.updated_at,
            url: comment.html_url,
          }))

          // Apply JMESPath query if provided
          data = applyQuery(data, options.query, msg.errorPrefix, msg.unknownError)

          outputData(data, outputFormat, fields)
          return
        }

        // Human-readable output
        if (comments.length === 0) {
          console.log(msg.noComments)
          return
        }

        console.log(msg.foundComments(comments.length))
        comments.forEach((comment, index) => {
          console.log(`\n[${index + 1}/${comments.length}]`)
          console.log(formatComment(comment))
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
