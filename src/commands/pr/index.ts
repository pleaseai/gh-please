import { Command } from 'commander'
import { passThroughCommand } from '../../lib/gh-passthrough'
import { createReviewCommand } from './review'
import { createReviewCommentEditCommand } from './review-comment-edit'

/**
 * Helper function to redirect deprecated commands to their new equivalents
 * @param cmd - The new command instance to execute
 * @param positionalArg - The main positional argument value
 * @param options - Options object from the deprecated command
 */
async function redirectToNewCommand(
  cmd: Command,
  positionalArg: string,
  options: Record<string, string | boolean | undefined>,
): Promise<void> {
  const args = [positionalArg]

  // Build args array from options
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined && value !== false) {
      const flag = key.length === 1 ? `-${key}` : `--${key}`
      if (typeof value === 'boolean') {
        args.push(flag)
      }
      else {
        args.push(flag, value)
      }
    }
  }

  await cmd.parseAsync(args, { from: 'user' })
}

export function createPrCommand(): Command {
  const command = new Command('pr')

  command.description('Manage pull requests')

  // Add new review subcommand group
  command.addCommand(createReviewCommand())

  // Add deprecated commands with warnings
  const deprecatedReviewReply = new Command('review-reply')
    .description('(Deprecated) Use \'gh please pr review reply\' instead')
    .argument('<comment-id>', 'ID of the review comment to reply to')
    .option('-b, --body <text>', 'Reply body text')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format (required if not in PR context)')
    .option('--pr <number>', 'PR number (required with --repo)')
    .action(async (commentIdStr: string, options: { body?: string, repo?: string, pr?: string }) => {
      console.warn('⚠️  Warning: \'gh please pr review-reply\' is deprecated.')
      console.warn('   Please use \'gh please pr review reply\' instead.')
      console.warn('')

      const { createReviewReplyCommand: createNewReplyCommand } = await import('./review/reply')
      const cmd = createNewReplyCommand()
      await redirectToNewCommand(cmd, commentIdStr, options)
    })

  command.addCommand(deprecatedReviewReply)

  const deprecatedResolve = new Command('resolve')
    .description('(Deprecated) Use \'gh please pr review thread resolve\' instead')
    .argument('<pr-number>', 'Pull request number')
    .option('--thread <id>', 'Specific thread ID to resolve')
    .option('--all', 'Resolve all unresolved threads')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(
      async (
        prNumberStr: string,
        options: { thread?: string, all?: boolean, repo?: string },
      ) => {
        console.warn('⚠️  Warning: \'gh please pr resolve\' is deprecated.')
        console.warn('   Please use \'gh please pr review thread resolve\' instead.')
        console.warn('')

        const { createThreadResolveCommand } = await import('./review/thread-resolve')
        const cmd = createThreadResolveCommand()
        await redirectToNewCommand(cmd, prNumberStr, options)
      },
    )

  command.addCommand(deprecatedResolve)

  // Keep deprecated review-comment group for backward compatibility
  const deprecatedReviewComment = new Command('review-comment')
    .description('(Deprecated) Use \'gh please pr review comment\' instead')

  const deprecatedEdit = createReviewCommentEditCommand()
  deprecatedEdit.hook('preAction', () => {
    console.warn('⚠️  Warning: \'gh please pr review-comment edit\' is deprecated.')
    console.warn('   Please use \'gh please pr review comment edit\' instead.')
    console.warn('')
  })

  deprecatedReviewComment.addCommand(deprecatedEdit)
  command.addCommand(deprecatedReviewComment)

  // Enable passthrough for unknown subcommands
  command.allowUnknownOption()
  command.on('command:*', async (_operands) => {
    const subArgs = command.args.length > 0 ? command.args : process.argv.slice(3)
    await passThroughCommand(['pr', ...subArgs])
  })

  return command
}
