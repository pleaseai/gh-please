import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getAiMessages } from '../../lib/i18n'
import { triggerPleaseAIPr } from '../../lib/please-trigger'

/**
 * Creates a command to trigger PleaseAI to apply suggestions on a pull request
 * @returns Command object configured for applying suggestions
 */
export function createApplyCommand(): Command {
  const command = new Command('apply')

  command
    .description('Trigger PleaseAI to apply suggestions from a pull request')
    .argument('<pr-number>', 'Pull request number to apply')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (prNumberStr: string, options: { repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getAiMessages(lang)

      try {
        const prNumber = Number.parseInt(prNumberStr, 10)
        if (Number.isNaN(prNumber)) {
          throw new TypeError(msg.prNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        console.log(msg.triggeringApply(prNumber))
        await triggerPleaseAIPr('apply', owner, repo, prNumber)
        console.log(msg.applyPosted(prNumber))
        console.log(`   View: https://github.com/${owner}/${repo}/pull/${prNumber}`)
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  return command
}
