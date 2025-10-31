import type { DevelopOptions } from '../../types'
import * as fs from 'node:fs'
import { confirm, select } from '@clack/prompts'
import { Command } from 'commander'
import { createWorktree, fetchBranch, getAllLinkedBranches, startDevelopWorkflow } from '../../lib/git-workflow'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'
import { cloneBareRepo, findBareRepo, resolveRepository } from '../../lib/repo-manager'

/**
 * Creates a command to start developing on an issue
 * Default mode: Creates branch only (passes through to gh issue develop)
 * --checkout: Creates branch and checks out (passes through to gh issue develop --checkout)
 * --worktree: Creates isolated worktree workspace (gh-please extension)
 */
export function createDevelopCommand(): Command {
  const command = new Command('develop')
    .alias('dev')
    .description('Start working on an issue (default: creates branch only)')
    .argument('<issue-number>', 'Issue number')
    .option('-R, --repo <owner/repo>', 'Repository (required if outside git repo)')
    .option('--checkout', 'Create branch and checkout (passes through to gh issue develop --checkout)')
    .option('--worktree', 'Create isolated worktree workspace (gh-please extension)')
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

        // Worktree mode: gh-please extension feature
        if (options.worktree) {
          // Resolve repository
          console.log(msg.developCheckingRepo)
          const repoInfo = await resolveRepository(options.repo)
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
            // Single existing branch, offer clear options
            const selectedOption = await select({
              message: `Branch "${existingBranches[0]}" exists.`,
              options: [
                { label: `✅ Use existing: ${existingBranches[0]}`, value: 'use' },
                { label: '✨ Create new branch', value: 'new' },
                { label: '❌ Cancel', value: 'cancel' },
              ],
            })
            if (selectedOption === 'cancel') {
              console.log('Cancelled.')
              process.exit(0)
            }
            branch = selectedOption === 'use' ? existingBranches[0]! : await startDevelopWorkflow(issueNumber, options)
          }
          else {
            // Multiple existing branches, let user choose
            const selectedOption = await select({
              message: 'Select a branch:',
              options: [
                ...existingBranches.map(b => ({ label: `✅ ${b}`, value: b })),
                { label: '✨ Create new branch', value: '__new__' },
                { label: '❌ Cancel', value: '__cancel__' },
              ],
            })
            if (selectedOption === '__cancel__') {
              console.log('Cancelled.')
              process.exit(0)
            }
            if (!selectedOption || typeof selectedOption !== 'string') {
              throw new Error('Branch selection cancelled')
            }
            branch = selectedOption === '__new__' ? await startDevelopWorkflow(issueNumber, options) : selectedOption
          }

          // Prepare worktree path
          const worktreePath = `~/.please/worktrees/${repoInfo.repo}/${branch}`
          const expandedPath = worktreePath.replace(/^~/, process.env.HOME || '')

          // Check if worktree already exists
          if (fs.existsSync(expandedPath)) {
            console.log(`✅ Worktree already exists!`)
            console.log(`cd ${expandedPath}`)
          }
          else {
            // Fetch branch into bare repo before creating worktree
            console.log(`📥 Fetching branch ${branch}...`)
            await fetchBranch(bareRepoPath, branch)

            // Create worktree
            console.log(msg.developCreateWorktree(worktreePath))
            await createWorktree(bareRepoPath, branch, worktreePath)

            console.log(msg.developWorktreeReady(expandedPath))
            console.log(`cd ${expandedPath}`)
          }
        }
        else {
          // Default mode (no --worktree): Pass through to gh issue develop
          // This supports both default (branch only) and --checkout modes
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
