import { Command } from 'commander'
import { createCleanupCommand } from './cleanup'
import { createIssueCommentEditCommand } from './comment-edit'
import { createIssueCommentListCommand } from './comment-list'
import { createDependencyCommand } from './dependency'
import { createDevelopCommand } from './develop'
import { createSubIssueCommand } from './sub-issue'

export function createIssueCommand(): Command {
  const command = new Command('issue')

  command.description('Manage GitHub issues')

  command.addCommand(createSubIssueCommand())
  command.addCommand(createDependencyCommand())
  command.addCommand(createDevelopCommand())
  command.addCommand(createCleanupCommand())

  // Add comment subcommand group
  const commentCommand = new Command('comment')
  commentCommand.description('Manage issue comments')
  commentCommand.addCommand(createIssueCommentEditCommand())
  commentCommand.addCommand(createIssueCommentListCommand())
  command.addCommand(commentCommand)

  return command
}
