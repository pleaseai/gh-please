import type { WorktreeInfo } from '../types'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { runCliCommand, warnWithFollowup } from './git-exec'

/**
 * Ensure parent directory exists for a target path
 * @param targetPath - Path to the target (may include ~)
 * @returns The expanded absolute path
 */
async function ensureParentDirectory(targetPath: string): Promise<string> {
  // Validate HOME is set when expanding tilde
  if (targetPath.startsWith('~') && !process.env.HOME) {
    throw new Error('Cannot expand ~: HOME environment variable is not set')
  }
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

  const result = await runCliCommand(['git', '-C', bareRepoPath, 'worktree', 'add', expandedPath, branch])

  if (result.exitCode !== 0) {
    throw new Error(`Failed to create worktree: ${result.stderr.trim()}`)
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

  // Step 1: Fetch the branch with explicit refspec to update remote-tracking ref
  // Using refspec ensures refs/remotes/origin/{branch} is updated
  const fetchResult = await runCliCommand([
    'git',
    '--git-dir',
    gitDir,
    'fetch',
    'origin',
    `${branch}:refs/remotes/origin/${branch}`,
  ])
  if (fetchResult.exitCode !== 0) {
    // Check if it's a "couldn't find remote ref" error (local-only branch)
    if (!fetchResult.stderr.includes('couldn\'t find remote ref')) {
      warnWithFollowup(
        `Could not fetch latest changes from remote: ${fetchResult.stderr.trim() || 'unknown error'}`,
        'Proceeding with local branch state. Your worktree may not have the latest remote changes.',
      )
    }
  }

  // Step 2: Check if remote-tracking ref exists before updating local branch
  // Using rev-parse is language-agnostic (avoids relying on localized error messages)
  const remoteRefCheck = await runCliCommand([
    'git',
    '--git-dir',
    gitDir,
    'rev-parse',
    '--verify',
    '--quiet',
    `refs/remotes/origin/${branch}`,
  ])
  const remoteRefExists = remoteRefCheck.exitCode === 0

  // Step 3: Update local branch to match remote (only if remote ref exists)
  // This ensures the worktree uses the latest code, not stale local branch
  if (remoteRefExists) {
    const branchResult = await runCliCommand([
      'git',
      '--git-dir',
      gitDir,
      'branch',
      '-f',
      branch,
      `refs/remotes/origin/${branch}`,
    ])
    // Warn for real errors (disk full, permission denied, lock file)
    // Skip warning for local-only branches (handled by remoteRefExists check)
    if (branchResult.exitCode !== 0) {
      warnWithFollowup(
        `Could not update local branch '${branch}': ${branchResult.stderr.trim() || 'unknown error'}`,
        'The worktree will be created, but may not have the latest remote changes.',
      )
    }
  }

  // Check if branch exists locally (for worktree add command selection)
  const checkResult = await runCliCommand(['git', '--git-dir', gitDir, 'rev-parse', '--verify', `refs/heads/${branch}`])
  const branchExists = checkResult.exitCode === 0

  // Create worktree with the branch
  const worktreeArgs = branchExists
    ? ['git', '--git-dir', gitDir, 'worktree', 'add', expandedPath, branch]
    : ['git', '--git-dir', gitDir, 'worktree', 'add', '-b', branch, expandedPath, `origin/${branch}`]

  const worktreeResult = await runCliCommand(worktreeArgs)
  if (worktreeResult.exitCode !== 0) {
    throw new Error(`Failed to create worktree at '${expandedPath}' for branch '${branch}': ${worktreeResult.stderr.trim()}`)
  }

  // Set upstream tracking for the branch in the worktree
  const trackingResult = await runCliCommand(['git', '-C', expandedPath, 'branch', '--set-upstream-to', `origin/${branch}`, branch])
  if (trackingResult.exitCode !== 0) {
    warnWithFollowup(
      `Could not set upstream tracking: ${trackingResult.stderr.trim() || 'unknown error'}`,
      `You may need to run: git push --set-upstream origin ${branch}`,
    )
  }
}

/**
 * List all worktrees for a repository
 */
export async function listWorktrees(bareRepoPath: string): Promise<WorktreeInfo[]> {
  const result = await runCliCommand(['git', '-C', bareRepoPath, 'worktree', 'list', '--porcelain'])

  if (result.exitCode !== 0) {
    // Log warning for debugging but return empty to allow caller to continue
    // This is a degraded operation - helps diagnose issues without breaking workflow
    warnWithFollowup(
      `Could not list worktrees for ${bareRepoPath}: ${result.stderr.trim() || 'unknown error'}`,
      'Worktree listing may be incomplete. Check if the repository path is correct.',
    )
    return []
  }

  return parseWorktreeOutput(result.stdout)
}

/**
 * Parse git worktree list --porcelain output
 */
function parseWorktreeOutput(output: string): WorktreeInfo[] {
  const worktrees: WorktreeInfo[] = []

  for (const line of output.trim().split('\n')) {
    if (!line)
      continue

    const parts = line.split(' ')
    const key = parts[0]

    if (key === 'worktree') {
      worktrees.push({
        path: parts.slice(1).join(' '),
        branch: '',
        commit: '',
        prunable: false,
      })
    }
    else if (worktrees.length > 0) {
      const current = worktrees[worktrees.length - 1]!
      if (key === 'branch') {
        current.branch = parts[1]?.replace(/^refs\/heads\//, '') || ''
      }
      else if (key === 'detached') {
        current.branch = 'detached'
      }
      else if (key === 'HEAD') {
        current.commit = parts[1] || ''
      }
      else if (key === 'prunable') {
        current.prunable = true
      }
    }
  }

  return worktrees
}

/**
 * Remove worktree at path
 */
export async function removeWorktree(worktreePath: string): Promise<void> {
  const result = await runCliCommand(['git', 'worktree', 'remove', worktreePath])

  if (result.exitCode !== 0) {
    throw new Error(`Failed to remove worktree: ${result.stderr.trim()}`)
  }
}
