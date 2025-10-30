import type { CommentInfo } from '../../types'
import { Command } from 'commander'
import { listIssueComments } from '../../lib/comment-api'
import { getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getCommentMessages } from '../../lib/i18n'
import { filterFields, outputJson, parseFields } from '@pleaseai/cli-toolkit/output'

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
    .action(async (issueNumberStr: string, options: { repo?: string, json?: string | boolean }) => {
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

        // Fetch comments (no progress messages in JSON mode)
        if (options.json === undefined) {
          console.log(msg.listingIssueComments(issueNumber))
        }
        const comments = await listIssueComments(owner, repo, issueNumber)

        // JSON output mode
        if (options.json !== undefined) {
          const fields = parseFields(options.json)
          const data = comments.map(comment => ({
            id: comment.id,
            body: comment.body,
            author: comment.user.login,
            createdAt: comment.created_at,
            updatedAt: comment.updated_at,
            url: comment.html_url,
          }))
          const output = filterFields(data, fields)
          outputJson(output)
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
