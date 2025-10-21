import { Command } from 'commander'
import { createReviewCommentEditCommand } from './comment-edit'
import { createReviewCommentListCommand } from './comment-list'
import { createReviewReplyCommand } from './reply'
import { createThreadResolveCommand } from './thread-resolve'

/**
 * Creates the review command group for PR review operations
 * @returns Command object configured with review subcommands
 */
export function createReviewCommand(): Command {
  const command = new Command('review')

  command.description('Manage pull request reviews')

  // Add reply subcommand
  command.addCommand(createReviewReplyCommand())

  // Add comment subcommand group
  const commentCommand = new Command('comment')
  commentCommand.description('Manage PR review comments')
  commentCommand.addCommand(createReviewCommentEditCommand())
  commentCommand.addCommand(createReviewCommentListCommand())
  command.addCommand(commentCommand)

  // Add thread subcommand group
  const threadCommand = new Command('thread')
  threadCommand.description('Manage PR review threads')
  threadCommand.addCommand(createThreadResolveCommand())
  command.addCommand(threadCommand)

  return command
}
