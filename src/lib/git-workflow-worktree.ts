import type { WorktreeInfo } from '../types'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Ensure parent directory exists for a target path
 * @param targetPath - Path to the target (may include ~)
 * @returns The expanded absolute path
 */
async function ensureParentDirectory(targetPath: string): Promise<string> {
  const expandedPath = targetPath.replace(/^~/, process.env.HOME || '')
  const parentDir = path.dirname(expandedPath)
  try {
    await fs.promises.mkdir(parentDir, { recursive: true })
  }
  catch (error) {
    throw new Error(`Failed to create directory ${parentDir}: ${error instanceof Error ? error.message : String(error)}`)
  }
  return expandedPath
}

/**
 * Create worktree at target path using git worktree add (from bare repo)
 */
export async function createWorktree(
  bareRepoPath: string,
  branch: string,
  targetPath: string,
): Promise<void> {
  const expandedPath = await ensureParentDirectory(targetPath)

  const proc = Bun.spawn(
    ['git', '-C', bareRepoPath, 'worktree', 'add', expandedPath, branch],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to create worktree: ${error.trim()}`)
  }
}

/**
 * Create worktree from a cloned repository (non-bare)
 * Uses the existing repo's git directory to create worktree
 * This ensures proper remote tracking for fetch operations in the worktree
 */
export async function createWorktreeFromRepo(
  gitDir: string,
  branch: string,
  targetPath: string,
): Promise<void> {
  const expandedPath = await ensureParentDirectory(targetPath)

  // First, fetch the branch to ensure we have the latest
  const fetchProc = Bun.spawn(
    ['git', '--git-dir', gitDir, 'fetch', 'origin', branch],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )

  const fetchExitCode = await fetchProc.exited
  // Log warning if fetch fails - branch might be local only or already up to date
  if (fetchExitCode !== 0) {
    const fetchError = await new Response(fetchProc.stderr).text()
    console.warn(`⚠️ Warning: Could not fetch latest changes from remote: ${fetchError.trim() || 'unknown error'}`)
    console.warn(`   Proceeding with local branch state. Your worktree may not have the latest remote changes.`)
  }

  // Check if branch exists locally
  const checkProc = Bun.spawn(
    ['git', '--git-dir', gitDir, 'rev-parse', '--verify', `refs/heads/${branch}`],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )

  const branchExists = (await checkProc.exited) === 0

  // Create worktree with the branch
  // If branch exists locally, just use it
  // If not, create it tracking origin/{branch}
  const worktreeArgs = branchExists
    ? ['git', '--git-dir', gitDir, 'worktree', 'add', expandedPath, branch]
    : ['git', '--git-dir', gitDir, 'worktree', 'add', '-b', branch, expandedPath, `origin/${branch}`]

  const proc = Bun.spawn(worktreeArgs, {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to create worktree at '${expandedPath}' for branch '${branch}': ${error.trim()}`)
  }

  // Set upstream tracking for the branch in the worktree
  const trackingProc = Bun.spawn(
    ['git', '-C', expandedPath, 'branch', '--set-upstream-to', `origin/${branch}`, branch],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )

  const trackingExitCode = await trackingProc.exited
  // Log warning if tracking fails - upstream might not exist for new branches
  if (trackingExitCode !== 0) {
    const trackingError = await new Response(trackingProc.stderr).text()
    console.warn(`⚠️ Warning: Could not set upstream tracking: ${trackingError.trim() || 'unknown error'}`)
    console.warn(`   You may need to run: git push --set-upstream origin ${branch}`)
  }
}

/**
 * List all worktrees for a repository
 */
export async function listWorktrees(bareRepoPath: string): Promise<WorktreeInfo[]> {
  const proc = Bun.spawn(['git', '-C', bareRepoPath, 'worktree', 'list', '--porcelain'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    return []
  }

  const worktrees: WorktreeInfo[] = []

  for (const line of output.trim().split('\n')) {
    if (!line)
      continue

    // Parse worktree list porcelain format
    // Format: "worktree /path/to/worktree"
    //         "branch /refs/heads/branch-name"
    //         "detached"
    //         "prunable" (optional)

    const parts = line.split(' ')
    if (parts[0] === 'worktree') {
      const worktreePath = parts.slice(1).join(' ')
      worktrees.push({
        path: worktreePath,
        branch: '',
        commit: '',
        prunable: false,
      })
    }
    else if (parts[0] === 'branch' && worktrees.length > 0) {
      const branchRef = parts[1]
      const branch = branchRef?.replace(/^refs\/heads\//, '') || ''
      worktrees[worktrees.length - 1]!.branch = branch
    }
    else if (parts[0] === 'detached' && worktrees.length > 0) {
      worktrees[worktrees.length - 1]!.branch = 'detached'
    }
    else if (parts[0] === 'HEAD' && worktrees.length > 0) {
      worktrees[worktrees.length - 1]!.commit = parts[1] || ''
    }
    else if (parts[0] === 'prunable' && worktrees.length > 0) {
      worktrees[worktrees.length - 1]!.prunable = true
    }
  }

  return worktrees
}

/**
 * Remove worktree at path
 */
export async function removeWorktree(worktreePath: string): Promise<void> {
  const proc = Bun.spawn(['git', 'worktree', 'remove', worktreePath], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to remove worktree: ${error.trim()}`)
  }
}
