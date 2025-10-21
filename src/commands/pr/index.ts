import { Command } from 'commander'
import { createResolveCommand } from './resolve'
import { createReviewCommentEditCommand } from './review-comment-edit'
import { createReviewReplyCommand } from './review-reply'

export function createPrCommand(): Command {
  const command = new Command('pr')

  command.description('Manage pull requests')

  command.addCommand(createReviewReplyCommand())
  command.addCommand(createResolveCommand())

  // Add review-comment subcommand group
  const reviewCommentCommand = new Command('review-comment')
  reviewCommentCommand.description('Manage PR review comments')
  reviewCommentCommand.addCommand(createReviewCommentEditCommand())
  command.addCommand(reviewCommentCommand)

  return command
}
