import { Command } from 'commander'
import { getPrNodeId, listReviewThreads, resolveReviewThread } from '../../lib/github'
import { getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getPrMessages } from '../../lib/i18n'

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
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(
      async (
        prNumberStr: string,
        options: { thread?: string, all?: boolean, repo?: string },
      ) => {
        const lang = detectSystemLanguage()
        const msg = getPrMessages(lang)

        try {
          const prNumber = Number.parseInt(prNumberStr, 10)
          if (Number.isNaN(prNumber)) {
            throw new TypeError(msg.prNumberInvalid)
          }

          if (!options.thread && !options.all) {
            throw new Error(msg.mustSpecify)
          }

          const { owner, repo } = await getRepoInfo(options.repo)
          const prNodeId = await getPrNodeId(owner, repo, prNumber)

          if (options.all) {
            console.log(msg.fetchingThreads(prNumber))
            const threads = await listReviewThreads(prNodeId)
            const unresolved = threads.filter(t => !t.isResolved)

            if (unresolved.length === 0) {
              console.log(msg.allResolved)
              return
            }

            console.log(msg.resolvingThreads(unresolved.length))
            for (const thread of unresolved) {
              await resolveReviewThread(thread.nodeId)
              console.log(msg.resolvedThread(thread.path, thread.line))
            }
            console.log(msg.resolvedCount(unresolved.length))
          }
          else if (options.thread) {
            console.log(msg.resolvingThread(options.thread))
            await resolveReviewThread(options.thread)
            console.log(msg.threadResolved)
          }

          console.log(`   View: https://github.com/${owner}/${repo}/pull/${prNumber}`)
        }
        catch (error) {
          console.error(
            `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
          )
          process.exit(1)
        }
      },
    )

  return command
}
