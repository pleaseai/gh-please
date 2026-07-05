import type { DevelopOptions } from '../types'
import { getGhCommand } from './gh-command'
import { runCliCommand } from './git-exec'

// Re-export worktree functions from dedicated module
export {
  createWorktree,
  createWorktreeFromRepo,
  listWorktrees,
  removeWorktree,
} from './git-workflow-worktree'

/**
 * Get all linked branches for an issue using GitHub GraphQL API
 */
export async function getAllLinkedBranches(
  issueNumber: number,
  repo?: string,
): Promise<string[]> {
  if (!repo) {
    // For now, if no repo specified, return empty array
    // This is a limitation of the current implementation - auto-detection not yet implemented
    return []
  }

  const parts = repo.split('/')
  if (parts.length !== 2) {
    return []
  }
  const owner = parts[0]!
  const repoName = parts[1]!

  const query = `
    query GetLinkedBranches($owner: String!, $repo: String!, $issueNumber: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $issueNumber) {
          linkedBranches(first: 100) {
            nodes {
              ref {
                name
              }
            }
          }
        }
      }
    }
  `

  const args = [
    getGhCommand(),
    'api',
    'graphql',
    '-f',
    `query=${query}`,
    '-F',
    `owner=${owner}`,
    '-F',
    `repo=${repoName}`,
    '-F',
    `issueNumber=${issueNumber}`,
  ]

  const result = await runCliCommand(args)

  if (result.exitCode !== 0) {
    // GraphQL query failed
    if (result.stderr.trim()) {
      console.warn(`⚠️  Failed to get linked branches: ${result.stderr.trim()}`)
    }
    return []
  }

  try {
    const data = JSON.parse(result.stdout)
    const branches = data?.data?.repository?.issue?.linkedBranches?.nodes || []
    return branches
      .map((node: unknown) => {
        const typedNode = node as { ref?: { name?: string } }
        return typedNode?.ref?.name
      })
      .filter((name: string | undefined) => name !== undefined)
  }
  catch {
    // Parse error, return empty array
    return []
  }
}

/**
 * Get first linked branch for issue (legacy function, use getAllLinkedBranches instead)
 */
export async function getLinkedBranch(
  issueNumber: number,
  repo?: string,
): Promise<string | null> {
  const branches = await getAllLinkedBranches(issueNumber, repo)
  return branches.length > 0 ? branches[0]! : null
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

  const result = await runCliCommand(args)

  if (result.exitCode !== 0) {
    throw new Error(`Failed to develop issue: ${result.stderr.trim()}`)
  }

  // Parse branch name from gh issue develop output
  // With --checkout: "Switched to a new branch 'feat-123-title'"
  const branchMatch = result.stdout.match(/'([^']+)'/)
  if (branchMatch) {
    return branchMatch[1]!
  }

  // Without --checkout: "github.com/owner/repo/tree/branch-name"
  const urlMatch = result.stdout.match(/\/tree\/(\S+)/)
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
 * Fetch branch from remote into a bare repository with proper remote tracking
 * Uses two-step approach:
 * 1. Fetch to refs/remotes/origin/{branch} for remote tracking
 * 2. Create/update local branch pointing to the same commit
 */
export async function fetchBranch(
  bareRepoPath: string,
  branch: string,
): Promise<void> {
  // Step 1: Fetch to remote tracking branch (refs/remotes/origin/{branch})
  const fetchResult = await runCliCommand(
    ['git', '-C', bareRepoPath, 'fetch', 'origin', `${branch}:refs/remotes/origin/${branch}`],
  )

  if (fetchResult.exitCode !== 0) {
    throw new Error(`Failed to fetch branch: ${fetchResult.stderr.trim()}`)
  }

  // Step 2: Create or update local branch from remote tracking branch
  // Try to create the branch first
  const createResult = await runCliCommand(
    ['git', '-C', bareRepoPath, 'branch', branch, `refs/remotes/origin/${branch}`],
  )

  if (createResult.exitCode !== 0) {
    // Branch might already exist, try to update it
    const updateResult = await runCliCommand(
      ['git', '-C', bareRepoPath, 'branch', '-f', branch, `refs/remotes/origin/${branch}`],
    )

    if (updateResult.exitCode !== 0) {
      throw new Error(`Failed to update local branch: ${updateResult.stderr.trim()}`)
    }
  }
}
