import type { RepositoryInfo } from '../types'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

/**
 * Get the gh command path from environment variable or use default
 */
function getGhCommand(): string {
  return process.env.GH_PATH || 'gh'
}

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
 * Find bare repository at ~/repos/{owner}/{repo}.git
 * Returns path if exists, null otherwise
 */
export async function findBareRepo(owner: string, repo: string): Promise<string | null> {
  const bareRepoPath = path.join(os.homedir(), 'repos', owner, `${repo}.git`)

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
  const proc = Bun.spawn(['git', 'rev-parse', '--git-dir'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const exitCode = await proc.exited
  return exitCode === 0
}

/**
 * Clone repository as bare to ~/repos/{owner}/{repo}.git
 */
export async function cloneBareRepo(owner: string, repo: string): Promise<string> {
  const bareRepoPath = path.join(os.homedir(), 'repos', owner, `${repo}.git`)
  const parentDir = path.dirname(bareRepoPath)

  // Create parent directories if they don't exist
  try {
    await fs.promises.mkdir(parentDir, { recursive: true })
  }
  catch (error) {
    throw new Error(`Failed to create directory ${parentDir}: ${error instanceof Error ? error.message : String(error)}`)
  }

  // Clone as bare repository
  const proc = Bun.spawn(
    [getGhCommand(), 'repo', 'clone', `${owner}/${repo}`, bareRepoPath, '--', '--bare'],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to clone repository: ${error.trim()}`)
  }

  return bareRepoPath
}

/**
 * Get current repository information (owner/repo from gh CLI)
 */
async function getCurrentRepoInfo(): Promise<{ owner: string, repo: string }> {
  const proc = Bun.spawn([getGhCommand(), 'repo', 'view', '--json', 'owner,name'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to get repository info: ${error.trim() || 'Not in a git repository'}`)
  }

  const data = JSON.parse(output)
  return {
    owner: data.owner?.login || data.owner,
    repo: data.name,
  }
}

/**
 * Resolve repository information from --repo flag or current directory
 */
export async function resolveRepository(repoFlag?: string): Promise<RepositoryInfo> {
  let owner: string
  let repo: string

  if (repoFlag) {
    // Parse from --repo flag
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
  }

  const bareRepoPath = path.join(os.homedir(), 'repos', owner, `${repo}.git`)

  return {
    owner,
    repo,
    localPath: bareRepoPath,
    isBare: true,
  }
}
