import type { DevelopOptions, WorktreeInfo } from '../types'
import * as fs from 'node:fs'
import * as path from 'node:path'

/**
 * Get the gh command path from environment variable or use default
 */
function getGhCommand(): string {
  return process.env.GH_PATH || 'gh'
}

/**
 * Get linked branch for issue using gh issue develop --list
 */
export async function getLinkedBranch(
  issueNumber: number,
  repo?: string,
): Promise<string | null> {
  const args = [getGhCommand(), 'issue', 'develop', String(issueNumber), '--list', '--json', 'headRefName']

  if (repo) {
    args.splice(3, 0, '-R', repo)
  }

  const proc = Bun.spawn(args, {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    // No linked branch yet
    return null
  }

  try {
    const data = JSON.parse(output)
    if (data && data.length > 0) {
      return data[0].headRefName
    }
  }
  catch {
    // Parse error, return null
  }

  return null
}

/**
 * Start develop workflow for issue (checkout or create branch)
 */
export async function startDevelopWorkflow(
  issueNumber: number,
  options: DevelopOptions,
): Promise<string> {
  const args = [getGhCommand(), 'issue', 'develop', String(issueNumber)]

  if (options.repo) {
    args.splice(3, 0, '-R', options.repo)
  }

  // Only use --checkout if explicitly requested (in checkout mode)
  if (options.checkout) {
    args.push('--checkout')
  }

  if (options.base) {
    args.push('-b', options.base)
  }

  if (options.name) {
    args.push('-n', options.name)
  }

  const proc = Bun.spawn(args, {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to develop issue: ${error.trim()}`)
  }

  // Parse branch name from gh issue develop output
  // With --checkout: "Switched to a new branch 'feat-123-title'"
  const branchMatch = output.match(/'([^']+)'/)
  if (branchMatch) {
    return branchMatch[1]!
  }

  // Without --checkout: "github.com/owner/repo/tree/branch-name"
  const urlMatch = output.match(/\/tree\/(\S+)/)
  if (urlMatch) {
    return urlMatch[1]!.trim()
  }

  // Fallback: get linked branch
  const linkedBranch = await getLinkedBranch(issueNumber, options.repo)
  if (linkedBranch) {
    return linkedBranch
  }

  throw new Error('Failed to determine branch name')
}

/**
 * Create worktree at target path using git worktree add
 */
export async function createWorktree(
  bareRepoPath: string,
  branch: string,
  targetPath: string,
): Promise<void> {
  // Expand ~ to home directory
  const expandedPath = targetPath.replace(/^~/, process.env.HOME || '')

  // Create parent directories if needed
  const parentDir = path.dirname(expandedPath)
  try {
    await fs.promises.mkdir(parentDir, { recursive: true })
  }
  catch (error) {
    throw new Error(`Failed to create directory ${parentDir}: ${error instanceof Error ? error.message : String(error)}`)
  }

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
