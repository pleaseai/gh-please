import { Command } from 'commander'
import { passThroughCommand } from '../../lib/gh-passthrough'
import { createRepoListCommand } from './list'

export function createRepoCommand(): Command {
  const command = new Command('repo')

  command.description('Manage GitHub repositories')

  command.addCommand(createRepoListCommand())

  // Enable passthrough for unknown subcommands
  command.allowUnknownOption()
  command.on('command:*', async (_operands) => {
    const subArgs = command.args.length > 0 ? command.args : process.argv.slice(3)
    await passThroughCommand(['repo', ...subArgs])
  })

  return command
}
