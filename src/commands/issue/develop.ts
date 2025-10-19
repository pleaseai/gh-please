import type { DevelopOptions } from '../../types'
import { confirm, select } from '@clack/prompts'
import { Command } from 'commander'
import { createWorktree, fetchBranch, getAllLinkedBranches, startDevelopWorkflow } from '../../lib/git-workflow'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'
import { cloneBareRepo, findBareRepo, resolveRepository } from '../../lib/repo-manager'

/**
 * Creates a command to start developing on an issue
 * Default mode creates a worktree for isolated development
 * Use --checkout to checkout branch in current repo instead
 */
export function createDevelopCommand(): Command {
  const command = new Command('develop')
    .alias('dev')
    .description('Start working on an issue with automatic worktree setup')
    .argument('<issue-number>', 'Issue number')
    .option('-R, --repo <owner/repo>', 'Repository (required if outside git repo)')
    .option('--checkout', 'Checkout branch in current repo instead of creating worktree')
    .option('-b, --base <branch>', 'Base branch for developing')
    .option('-n, --name <name>', 'Custom branch name')
    .action(async (issueNumberStr: string, options: DevelopOptions) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        const issueNumber = Number.parseInt(issueNumberStr, 10)
        if (Number.isNaN(issueNumber)) {
          throw new TypeError(msg.issueNumberInvalid)
        }

        console.log(msg.developStarting(issueNumber))

        // Resolve repository
        console.log(msg.developCheckingRepo)
        const repoInfo = await resolveRepository(options.repo)

        // Default: worktree mode. Only use checkout if explicitly requested
        if (!options.checkout) {
          let bareRepoPath = await findBareRepo(repoInfo.owner, repoInfo.repo)

          if (!bareRepoPath) {
            // Prompt to clone
            const shouldClone = await confirm({
              message: msg.developPromptClone(repoInfo.owner, repoInfo.repo),
            })

            if (!shouldClone) {
              console.log('Cancelled.')
              process.exit(0)
            }

            console.log(msg.developCloning(repoInfo.owner, repoInfo.repo))
            bareRepoPath = await cloneBareRepo(repoInfo.owner, repoInfo.repo)
          }

          // Check for existing linked branches
          const existingBranches = await getAllLinkedBranches(issueNumber, options.repo)

          let branch: string
          if (existingBranches.length === 0) {
            // No existing branches, create a new one
            branch = await startDevelopWorkflow(issueNumber, options)
          }
          else if (existingBranches.length === 1) {
            // Single existing branch, ask user
            const useExisting = await confirm({
              message: `Use existing branch "${existingBranches[0]}"?`,
            })
            branch = useExisting ? existingBranches[0]! : await startDevelopWorkflow(issueNumber, options)
          }
          else {
            // Multiple existing branches, let user choose
            const selectedOption = await select({
              message: 'Select a branch:',
              options: [
                ...existingBranches.map(b => ({ label: b, value: b })),
                { label: '✨ Create new branch', value: '__new__' },
              ],
            })
            branch = selectedOption === '__new__' ? await startDevelopWorkflow(issueNumber, options) : (selectedOption as string)
          }

          // Fetch branch into bare repo before creating worktree
          console.log(`📥 Fetching branch ${branch}...`)
          await fetchBranch(bareRepoPath, branch)

          // Create worktree
          const worktreePath = `~/worktrees/${repoInfo.repo}/${branch}`
          const expandedPath = worktreePath.replace(/^~/, process.env.HOME || '')
          console.log(msg.developCreateWorktree(worktreePath))
          await createWorktree(bareRepoPath, branch, worktreePath)

          console.log(msg.developWorktreeReady(expandedPath))
          console.log(`cd ${expandedPath}`)
        }
        else {
          // Default mode: checkout
          const branch = await startDevelopWorkflow(issueNumber, options)
          console.log(msg.developBranchReady(branch))
        }
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
