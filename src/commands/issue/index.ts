import { Command } from 'commander'
import { createDependencyCommand } from './dependency'
import { createSubIssueCommand } from './sub-issue'

export function createIssueCommand(): Command {
  const command = new Command('issue')

  command.description('Manage GitHub issues')

  command.addCommand(createSubIssueCommand())
  command.addCommand(createDependencyCommand())

  return command
}
