import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import { getPrNodeId, listReviewThreads, resolveReviewThread } from '../../lib/github-graphql'

/**
 * Creates a command to resolve review threads on pull requests
 * @returns Command object configured for resolving threads
 */
export function createResolveCommand(): Command {
  const command = new Command('resolve')

  command
    .description('Resolve review threads on a pull request')
    .argument('<pr-number>', 'Pull request number')
    .option('--thread <id>', 'Specific thread ID to resolve')
    .option('--all', 'Resolve all unresolved threads')
    .action(
      async (
        prNumberStr: string,
        options: { thread?: string, all?: boolean },
      ) => {
        try {
          const prNumber = Number.parseInt(prNumberStr, 10)
          if (isNaN(prNumber)) {
            throw new TypeError('PR number must be valid')
          }

          if (!options.thread && !options.all) {
            throw new Error('Must specify either --thread <id> or --all')
          }

          const { owner, repo } = await getRepoInfo()
          const prNodeId = await getPrNodeId(owner, repo, prNumber)

          if (options.all) {
            console.log(`🔍 Fetching review threads for PR #${prNumber}...`)
            const threads = await listReviewThreads(prNodeId)
            const unresolved = threads.filter(t => !t.isResolved)

            if (unresolved.length === 0) {
              console.log(`✅ All threads are already resolved!`)
              return
            }

            console.log(`📝 Resolving ${unresolved.length} thread(s)...`)
            for (const thread of unresolved) {
              await resolveReviewThread(thread.nodeId)
              console.log(`  ✓ Resolved thread at ${thread.path}:${thread.line}`)
            }
            console.log(`✅ Resolved ${unresolved.length} thread(s)!`)
          }
          else if (options.thread) {
            console.log(`📝 Resolving thread ${options.thread}...`)
            await resolveReviewThread(options.thread)
            console.log(`✅ Thread resolved!`)
          }

          console.log(`   View: https://github.com/${owner}/${repo}/pull/${prNumber}`)
        }
        catch (error) {
          console.error(
            `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          )
          process.exit(1)
        }
      },
    )

  return command
}
