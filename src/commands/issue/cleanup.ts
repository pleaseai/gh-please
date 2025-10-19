import { multiselect } from '@clack/prompts'
import { Command } from 'commander'
import { listWorktrees, removeWorktree } from '../../lib/git-workflow'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'
import { resolveRepository } from '../../lib/repo-manager'

/**
 * Creates a command to clean up unused worktrees
 */
export function createCleanupCommand(): Command {
  const command = new Command('cleanup')
    .description('Remove unused worktrees')
    .option('-R, --repo <owner/repo>', 'Repository')
    .option('--all', 'Remove all worktrees without prompt')
    .action(async (options: { repo?: string, all?: boolean }) => {
      const lang = detectSystemLanguage()
      const msg = getIssueMessages(lang)

      try {
        // Resolve repository
        console.log(msg.cleanupListing)
        const repoInfo = await resolveRepository(options.repo)

        // List worktrees
        const worktrees = await listWorktrees(repoInfo.localPath)

        // Filter prunable worktrees
        const prunable = worktrees.filter(w => w.prunable)

        if (prunable.length === 0) {
          console.log(msg.cleanupNothingToClean)
          return
        }

        console.log(msg.cleanupFoundPrunable(prunable.length))

        // Select worktrees to remove
        let toRemove = prunable
        if (!options.all) {
          const selected = await multiselect({
            message: 'Select worktrees to remove:',
            options: prunable.map(w => ({
              value: w.path,
              label: `${w.path} (${w.branch})`,
            })),
          })

          if (typeof selected === 'symbol') {
            // User cancelled
            console.log('Cancelled.')
            return
          }

          toRemove = prunable.filter(w => selected.includes(w.path))
        }

        // Remove selected worktrees
        for (const wt of toRemove) {
          console.log(msg.cleanupRemoving(wt.path))
          await removeWorktree(wt.path)
        }

        console.log(msg.cleanupRemoved(toRemove.length))
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
