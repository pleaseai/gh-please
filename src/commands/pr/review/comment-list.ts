import { Command } from 'commander'
import { listReviewComments } from '../../../lib/comment-api'
import { getRepoInfo } from '../../../lib/github-api'
import { detectSystemLanguage, getCommentMessages } from '../../../lib/i18n'

/**
 * Format a review comment for display
 */
function formatReviewComment(comment: any): string {
  const lines = []
  lines.push(`  ID: ${comment.id}`)
  lines.push(`  Author: ${comment.user.login}`)
  lines.push(`  Created: ${new Date(comment.created_at).toLocaleString()}`)
  if (comment.updated_at !== comment.created_at) {
    lines.push(`  Updated: ${new Date(comment.updated_at).toLocaleString()}`)
  }
  if (comment.path) {
    lines.push(`  File: ${comment.path}${comment.line ? `:${comment.line}` : ''}`)
  }
  lines.push(`  URL: ${comment.html_url}`)
  lines.push(`  Body: ${comment.body.split('\n')[0]}${comment.body.length > 80 ? '...' : ''}`)
  return lines.join('\n')
}

/**
 * Creates a command to list PR review comments
 * @returns Command object configured for listing PR review comments
 */
export function createReviewCommentListCommand(): Command {
  const command = new Command('list')

  command
    .description('List all review comments for a pull request')
    .argument('<pr-number>', 'Pull request number')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (prNumberStr: string, options: { repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getCommentMessages(lang)

      try {
        // Parse PR number
        const prNumber = Number.parseInt(prNumberStr, 10)
        if (Number.isNaN(prNumber) || prNumber <= 0) {
          console.error('❌ Error: PR number must be a valid positive number')
          process.exit(1)
        }

        // Get repository info
        const { owner, repo } = await getRepoInfo(options.repo)

        // Fetch review comments
        console.log(msg.listingReviewComments(prNumber))
        const comments = await listReviewComments(owner, repo, prNumber)

        if (comments.length === 0) {
          console.log(msg.noComments)
          return
        }

        console.log(msg.foundComments(comments.length))
        comments.forEach((comment, index) => {
          console.log(`\n[${index + 1}/${comments.length}]`)
          console.log(formatReviewComment(comment))
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
