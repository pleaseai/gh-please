import type { RepositoryInfo } from '../types'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { getGhCommand } from './gh-command'
import { runGitCommand } from './git-exec'

/**
 * Parse repository string in format "owner/repo" or GitHub URL
 */
export function parseRepoString(repoStr: string): { owner: string, repo: string } {
  if (!repoStr || repoStr.trim() === '') {
    throw new Error('Repository string cannot be empty')
  }

  // Handle owner/repo format
  const simpleMatch = repoStr.match(/^([^/]+)\/([^/]+)$/)
  if (simpleMatch) {
    return { owner: simpleMatch[1]!, repo: simpleMatch[2]! }
  }

  // Handle GitHub URL format
  const urlMatch = repoStr.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(\.git)?$/)
  if (urlMatch) {
    return { owner: urlMatch[1]!, repo: urlMatch[2]! }
  }

  throw new Error(`Invalid repository format: ${repoStr}. Expected "owner/repo" or GitHub URL`)
}

/**
 * Find bare repository at ~/.please/repositories/{owner}/{repo}.git
 * Returns path if exists, null otherwise
 */
export async function findBareRepo(owner: string, repo: string): Promise<string | null> {
  const bareRepoPath = path.join(os.homedir(), '.please', 'repositories', owner, `${repo}.git`)

  try {
    const stats = await fs.promises.stat(bareRepoPath)
    if (stats.isDirectory()) {
      return bareRepoPath
    }
  }
  catch {
    // File not found or other error
  }

  return null
}

/**
 * Check if current directory is inside a git repository
 */
export async function isInGitRepo(): Promise<boolean> {
  const result = await runGitCommand(['git', 'rev-parse', '--git-dir'])
  return result.exitCode === 0
}

/**
 * Get the .git directory of the current repository
 * Returns absolute path if in a git repo, null otherwise
 */
export async function getGitDir(): Promise<string | null> {
  const result = await runGitCommand(['git', 'rev-parse', '--absolute-git-dir'])

  if (result.exitCode !== 0) {
    return null
  }

  return result.stdout.trim()
}

/**
 * Clone repository as bare to ~/.please/repositories/{owner}/{repo}.git
 */
export async function cloneBareRepo(owner: string, repo: string): Promise<string> {
  const bareRepoPath = path.join(os.homedir(), '.please', 'repositories', owner, `${repo}.git`)
  const parentDir = path.dirname(bareRepoPath)

  // Create parent directories if they don't exist
  try {
    await fs.promises.mkdir(parentDir, { recursive: true })
  }
  catch (error) {
    throw new Error(`Failed to create directory ${parentDir}: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Clone as bare repository
  const result = await runGitCommand(
    [getGhCommand(), 'repo', 'clone', `${owner}/${repo}`, bareRepoPath, '--', '--bare'],
  )

  if (result.exitCode !== 0) {
    throw new Error(`Failed to clone repository: ${result.stderr.trim()}`)
  }

  return bareRepoPath
}

/**
 * Get current repository information (owner/repo from gh CLI)
 */
async function getCurrentRepoInfo(): Promise<{ owner: string, repo: string }> {
  const result = await runGitCommand([getGhCommand(), 'repo', 'view', '--json', 'owner,name'])

  if (result.exitCode !== 0) {
    throw new Error(`Failed to get repository info: ${result.stderr.trim() || 'Not in a git repository'}`)
  }

  const data = JSON.parse(result.stdout)
  return {
    owner: data.owner?.login || data.owner,
    repo: data.name,
  }
}

/**
 * Resolve repository information from --repo flag or current directory
 * When inside a cloned repo without --repo flag, returns gitDir for worktree operations
 */
export async function resolveRepository(repoFlag?: string): Promise<RepositoryInfo> {
  let owner: string
  let repo: string
  let gitDir: string | undefined

  if (repoFlag) {
    // Parse from --repo flag - use bare repo mode
    const parsed = parseRepoString(repoFlag)
    owner = parsed.owner
    repo = parsed.repo
  }
  else {
    // Try to get from current directory
    const inGit = await isInGitRepo()
    if (!inGit) {
      throw new Error('Not in a git repository. Please specify --repo flag (e.g., --repo owner/repo)')
    }

    const currentRepo = await getCurrentRepoInfo()
    owner = currentRepo.owner
    repo = currentRepo.repo

    // Get gitDir for non-bare mode (worktree from current repo)
    gitDir = (await getGitDir()) ?? undefined
  }

  const bareRepoPath = path.join(os.homedir(), '.please', 'repositories', owner, `${repo}.git`)

  return {
    owner,
    repo,
    localPath: bareRepoPath,
    isBare: !gitDir, // false when we have gitDir (inside cloned repo without --repo)
    gitDir,
  }
}
