import { Command } from 'commander'
import { getRepoInfo } from '../../lib/github-api'
import {
  addSubIssue,
  getIssueNodeId,
  listSubIssues,
  removeSubIssue,
} from '../../lib/github-graphql'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'

/**
 * Creates a command to manage issue sub-issue relationships
 * @returns Command object with sub-commands (create, add, remove, list)
 */
export function createSubIssueCommand(): Command {
  const command = new Command('sub-issue')

  command.description('Manage sub-issues')

  // Create subcommand
  const createCmd = new Command('create')
    .description('Create a new sub-issue linked to a parent')
    .argument('<parent-issue>', 'Parent issue number')
    .requiredOption('--title <text>', 'Sub-issue title')
    .option('--body <text>', 'Sub-issue body')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (parentStr: string, options: { title: string, body?: string, repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const parentNumber = Number.parseInt(parentStr, 10)
        if (Number.isNaN(parentNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)
        console.log(msg.gettingParentIssue(parentNumber))

        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber)

        console.log(msg.creatingSubIssue)
        // For now, create issue via gh CLI and then link it
        // Use getGhCommand to allow test mocking via GH_PATH env var
        function getGhCommand(): string {
          return process.env.GH_PATH || 'gh'
        }

        const proc = Bun.spawn(
          [
            getGhCommand(),
            'issue',
            'create',
            '-R',
            `${owner}/${repo}`,
            '-t',
            options.title,
            ...(options.body ? ['-b', options.body] : []),
          ],
          {
            stdout: 'pipe',
            stderr: 'pipe',
          },
        )

        const output = await new Response(proc.stdout).text()
        const exitCode = await proc.exited

        if (exitCode !== 0) {
          const error = await new Response(proc.stderr).text()
          throw new Error(msg.createFailed(error.trim()))
        }

        // Parse the issue number from the output URL
        const urlMatch = output.match(/\/issues\/(\d+)/)
        if (!urlMatch || !urlMatch[1]) {
          throw new Error(msg.parseIssueFailed)
        }
        const childNumber = Number.parseInt(urlMatch[1], 10)

        // Now link it as a sub-issue
        const childNodeId = await getIssueNodeId(owner, repo, childNumber)
        await addSubIssue(parentNodeId, childNodeId)

        console.log(msg.subIssueCreatedLinked(childNumber, parentNumber))
        console.log(
          `   View: https://github.com/${owner}/${repo}/issues/${childNumber}`,
        )
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  // Add subcommand
  const addCmd = new Command('add')
    .description('Add existing issue as sub-issue to parent')
    .argument('<parent-issue>', 'Parent issue number')
    .argument('<child-issue>', 'Child issue number to add as sub-issue')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (parentStr: string, childStr: string, options: { repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const parentNumber = Number.parseInt(parentStr, 10)
        const childNumber = Number.parseInt(childStr, 10)

        if (Number.isNaN(parentNumber) || Number.isNaN(childNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        console.log(msg.gettingNodeIds)
        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber)
        const childNodeId = await getIssueNodeId(owner, repo, childNumber)

        console.log(msg.linkingSubIssue(childNumber, parentNumber))
        await addSubIssue(parentNodeId, childNodeId)

        console.log(msg.subIssueLinked)
        console.log(
          `   ${msg.parent}: https://github.com/${owner}/${repo}/issues/${parentNumber}`,
        )
        console.log(
          `   ${msg.child}: https://github.com/${owner}/${repo}/issues/${childNumber}`,
        )
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  // Remove subcommand
  const removeCmd = new Command('remove')
    .description('Remove sub-issue from parent')
    .argument('<parent-issue>', 'Parent issue number')
    .argument('<child-issue>', 'Child issue number to remove')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (parentStr: string, childStr: string, options: { repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const parentNumber = Number.parseInt(parentStr, 10)
        const childNumber = Number.parseInt(childStr, 10)

        if (Number.isNaN(parentNumber) || Number.isNaN(childNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        console.log(msg.gettingNodeIds)
        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber)
        const childNodeId = await getIssueNodeId(owner, repo, childNumber)

        console.log(msg.unlinkingSubIssue(childNumber, parentNumber))
        await removeSubIssue(parentNodeId, childNodeId)

        console.log(msg.subIssueUnlinked)
        console.log(
          `   ${msg.parent}: https://github.com/${owner}/${repo}/issues/${parentNumber}`,
        )
        console.log(
          `   ${msg.child}: https://github.com/${owner}/${repo}/issues/${childNumber}`,
        )
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  // List subcommand
  const listCmd = new Command('list')
    .description('List all sub-issues of a parent issue')
    .argument('<parent-issue>', 'Parent issue number')
    .option('-R, --repo <owner/repo>', 'Repository in owner/repo format')
    .action(async (parentStr: string, options: { repo?: string }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const parentNumber = Number.parseInt(parentStr, 10)
        if (Number.isNaN(parentNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        const { owner, repo } = await getRepoInfo(options.repo)

        console.log(msg.fetchingSubIssues(parentNumber))
        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber)
        const subIssues = await listSubIssues(parentNodeId)

        if (subIssues.length === 0) {
          console.log(msg.noSubIssues(parentNumber))
          return
        }

        console.log(msg.foundSubIssues(subIssues.length))
        for (const issue of subIssues) {
          const status = issue.state === 'OPEN' ? '🟢' : '🔴'
          console.log(`${status} #${issue.number}: ${issue.title}`)
        }
        console.log(
          `\nView: https://github.com/${owner}/${repo}/issues/${parentNumber}`,
        )
      }
      catch (error) {
        console.error(
          `${msg.errorPrefix}: ${error instanceof Error ? error.message : msg.unknownError}`,
        )
        process.exit(1)
      }
    })

  command.addCommand(createCmd)
  command.addCommand(addCmd)
  command.addCommand(removeCmd)
  command.addCommand(listCmd)

  return command
}
