import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import { detectSystemLanguage, getAiMessages } from '../../lib/i18n'
import { triggerPleaseAIIssue } from '../../lib/please-trigger'

/**
 * Creates a command to trigger PleaseAI triage for an issue
 * @returns Command object configured for triage operations
 */
export function createTriageCommand(): Command {
  const command = new Command('triage')

  command
    .description('Trigger PleaseAI to triage an issue')
    .argument('<issue-number>', 'Issue number to triage')
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

        console.log(msg.triggeringTriage(issueNumber))
        await triggerPleaseAIIssue('triage', owner, repo, issueNumber)
        console.log(msg.triagePosted(issueNumber))
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
