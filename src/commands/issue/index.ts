import { Command } from 'commander'
import { passThroughCommand } from '../../lib/gh-passthrough'
import { createCleanupCommand } from './cleanup'
import { createIssueCommentEditCommand } from './comment-edit'
import { createIssueCommentListCommand } from './comment-list'
import { createIssueCreateCommand } from './create'
import { createDependencyCommand } from './dependency'
import { createDevelopCommand } from './develop'
import { createSubIssueCommand } from './sub-issue'
import { createIssueTypeCommand } from './type'

export function createIssueCommand(): Command {
  const command = new Command('issue')

  command.description('Manage GitHub issues')

  command.addCommand(createIssueCreateCommand())
  command.addCommand(createSubIssueCommand())
  command.addCommand(createDependencyCommand())
  command.addCommand(createDevelopCommand())
  command.addCommand(createCleanupCommand())
  command.addCommand(createIssueTypeCommand())

  // Add comment subcommand group
  const commentCommand = new Command('comment')
  commentCommand.description('Manage issue comments')
  commentCommand.addCommand(createIssueCommentEditCommand())
  commentCommand.addCommand(createIssueCommentListCommand())
  command.addCommand(commentCommand)

  // Enable passthrough for unknown subcommands
  command.allowUnknownOption()
  command.on('command:*', async (_operands) => {
    const subArgs = command.args.length > 0 ? command.args : process.argv.slice(3)
    await passThroughCommand(['issue', ...subArgs])
  })

  return command
}
