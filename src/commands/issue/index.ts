import { Command } from 'commander'
import { createCleanupCommand } from './cleanup'
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

  return command
}
