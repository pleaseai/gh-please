#!/usr/bin/env bun

import { Command } from 'commander'
import packageJson from '../package.json' with { type: 'json' }
import { createIssueCommand } from './commands/issue'
import { createPluginCommand } from './commands/plugin'
import { createPrCommand } from './commands/pr'
import { passThroughCommand } from './lib/gh-passthrough'
import { PluginRegistry } from './plugins/plugin-registry'

const program = new Command()

program
  .name('gh-please')
  .description('GitHub CLI extension for managing pull requests and issues')
  .version(packageJson.version)

// Add core command groups
program.addCommand(createIssueCommand())
program.addCommand(createPrCommand())
program.addCommand(createPluginCommand())

// Load and register plugins
async function loadPlugins() {
  try {
    const registry = new PluginRegistry()
    await registry.loadPlugins()

    // Register commands from loaded plugins
    for (const plugin of registry.getAll()) {
      try {
        await plugin.init?.()
        const commands = plugin.registerCommands()
        for (const cmd of commands) {
          program.addCommand(cmd)
        }
      }
      catch (error) {
        console.warn(`Failed to load plugin '${plugin.name}':`, error)
      }
    }
  }
  catch (error) {
    // Failed to load plugins, continue with core commands only
    console.warn('Failed to load plugins:', error)
  }
}

// Deprecated: backward compatibility for review-reply
const deprecatedReviewReply = new Command('review-reply')
  .description('(Deprecated) Use \'gh please pr review-reply\' instead')
  .argument('<comment-id>', 'ID of the review comment to reply to')
  .option('-b, --body <text>', 'Reply body text')
  .action(async (commentIdStr: string, options: { body?: string }) => {
    console.warn('⚠️  Warning: \'gh please review-reply\' is deprecated.')
    console.warn('   Please use \'gh please pr review-reply\' instead.')
    console.warn('')

    const { createReviewReplyCommand } = await import('./commands/pr/review-reply')
    const cmd = createReviewReplyCommand()
    // Pass the comment-id and body to the new command
    const args = [commentIdStr]
    if (options.body) {
      args.push('-b', options.body)
    }
    await cmd.parseAsync(args, { from: 'user' })
  })

program.addCommand(deprecatedReviewReply)

// Main execution
async function main() {
  // Load plugins before parsing arguments
  await loadPlugins()

  // If no command provided, show help
  if (process.argv.length <= 2) {
    program.help()
  }

  // Fallback handler for unknown commands (passthrough to gh CLI)
  // This allows any unregistered gh command to be passed through
  program
    .allowUnknownOption()
    .action(async () => {
      // Get args after 'gh please' prefix
      const args = process.argv.slice(2)
      await passThroughCommand(args)
    })

  program.parse()
}

// Run main
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
