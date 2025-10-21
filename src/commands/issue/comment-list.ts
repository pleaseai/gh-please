import { Command } from 'commander'
import { listIssueComments } from '../../lib/comment-api'
import { getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getCommentMessages } from '../../lib/i18n'

/**
 * Format a comment for display
 */
function formatComment(comment: any): string {
  const lines = []
  lines.push(`  ID: ${comment.id}`)
  lines.push(`  Author: ${comment.user.login}`)
  lines.push(`  Created: ${new Date(comment.created_at).toLocaleString()}`)
  if (comment.updated_at !== comment.created_at) {
    lines.push(`  Updated: ${new Date(comment.updated_at).toLocaleString()}`)
  }
  lines.push(`  URL: ${comment.html_url}`)
  lines.push(`  Body: ${comment.body.split('\n')[0]}${comment.body.length > 80 ? '...' : ''}`)
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
    .action(async (issueNumberStr: string, options: { repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getCommentMessages(lang)

      try {
        // Parse issue number
        const issueNumber = Number.parseInt(issueNumberStr, 10)
        if (Number.isNaN(issueNumber) || issueNumber <= 0) {
          console.error('❌ Error: Issue number must be a valid positive number')
          process.exit(1)
        }

        // Get repository info
        const { owner, repo } = await getRepoInfo(options.repo)

        // Fetch comments
        console.log(msg.listingIssueComments(issueNumber))
        const comments = await listIssueComments(owner, repo, issueNumber)

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
