import type { DevelopOptions } from '../../types'
import { confirm } from '@clack/prompts'
import { Command } from 'commander'
import { createWorktree, startDevelopWorkflow } from '../../lib/git-workflow'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'
import { cloneBareRepo, findBareRepo, resolveRepository } from '../../lib/repo-manager'

/**
 * Creates a command to start developing on an issue
 * Supports both checkout mode (default) and worktree mode
 */
export function createDevelopCommand(): Command {
  const command = new Command('develop')
    .alias('dev')
    .description('Start working on an issue with automatic branch setup')
    .argument('<issue-number>', 'Issue number')
    .option('-R, --repo <owner/repo>', 'Repository (required if outside git repo)')
    .option('--worktree', 'Create worktree instead of checkout')
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

        // For worktree mode, ensure bare repo exists
        if (options.worktree) {
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

          // Create branch via gh issue develop
          const branch = await startDevelopWorkflow(issueNumber, options)

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
