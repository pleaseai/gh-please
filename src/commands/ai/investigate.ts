import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getAiMessages } from '../../lib/i18n'
import { triggerPleaseAIIssue } from '../../lib/please-trigger'

/**
 * Creates a command to trigger PleaseAI investigation for an issue
 * @returns Command object configured for investigation operations
 */
export function createInvestigateCommand(): Command {
  const command = new Command('investigate')

  command
    .description('Trigger PleaseAI to investigate an issue')
    .argument('<issue-number>', 'Issue number to investigate')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (issueNumberStr: string, options: { repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getAiMessages(lang)

      try {
        const issueNumber = Number.parseInt(issueNumberStr, 10)
        if (Number.isNaN(issueNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        console.log(msg.triggeringInvestigate(issueNumber))
        await triggerPleaseAIIssue('investigate', owner, repo, issueNumber)
        console.log(msg.investigatePosted(issueNumber))
        console.log(`   View: https://github.com/${owner}/${repo}/issues/${issueNumber}`)
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
