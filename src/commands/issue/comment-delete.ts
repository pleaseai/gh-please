import * as readline from 'node:readline'
import { Command } from 'commander'
import { deleteIssueCommentByNodeId } from '../../lib/github'
import { getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getCommentMessages } from '../../lib/i18n'
import { toIssueCommentNodeId, validateCommentIdentifier } from '../../lib/id-converter'

/**
 * Prompt user for confirmation
 * @param prompt - The prompt message to display
 * @returns Promise that resolves to true if user confirms, false otherwise
 */
async function confirm(prompt: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * Creates a command to delete issue comments
 * @returns Command object configured for deleting issue comments
 */
export function createIssueCommentDeleteCommand(): Command {
  const command = new Command('delete')

  command
    .description('Delete an issue comment')
    .argument('<comment-id>', 'Database ID (number) or Node ID (IC_...) of the issue comment')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .option('--issue <number>', 'Issue number (required when using Database ID)')
    .option('-y, --yes', 'Skip confirmation prompt')
    .action(async (commentIdStr: string, options: { repo?: string, issue?: string, yes?: boolean }) => {
      const lang = detectSystemLanguage()
      const msg = getCommentMessages(lang)

      try {
        // Validate comment identifier (Database ID or Node ID)
        const commentIdentifier = validateCommentIdentifier(commentIdStr)

        // Get repository info
        const { owner, repo } = await getRepoInfo(options.repo)

        // Convert comment identifier to Node ID
        let commentNodeId: string

        if (commentIdentifier.startsWith('IC_')) {
          // Already a Node ID, use directly
          commentNodeId = commentIdentifier
          console.log(`✓ Node ID detected, using directly`)
        }
        else {
          // Database ID - need issue number to convert
          if (!options.issue) {
            throw new Error(
              'Issue number is required when using Database ID. '
              + 'Use --issue <number> or provide Node ID instead.',
            )
          }

          const issueNumber = Number.parseInt(options.issue, 10)
          if (Number.isNaN(issueNumber)) {
            throw new TypeError('Invalid issue number')
          }

          console.log(`🔄 Converting Database ID to Node ID...`)
          commentNodeId = await toIssueCommentNodeId(
            commentIdentifier,
            owner,
            repo,
            issueNumber,
          )
        }

        // Prompt for confirmation unless --yes flag is provided
        if (!options.yes) {
          const confirmed = await confirm(msg.confirmDelete)
          if (!confirmed) {
            console.log(msg.deleteAborted)
            process.exit(0)
          }
        }

        // Delete comment using GraphQL
        console.log(msg.deletingComment(commentIdentifier))
        await deleteIssueCommentByNodeId(commentNodeId)

        console.log(msg.commentDeleted)
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
