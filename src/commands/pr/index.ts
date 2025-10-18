import { Command } from 'commander'
import { createResolveCommand } from './resolve'
import { createReviewReplyCommand } from './review-reply'

export function createPrCommand(): Command {
  const command = new Command('pr')

  command.description('Manage pull requests')

  command.addCommand(createReviewReplyCommand())
  command.addCommand(createResolveCommand())

  return command
}
