/**
 * GitHub ID conversion utilities
 * Converts between Database ID and Node ID for various GitHub entities
 */

import {
  isLegacyNodeId as isLegacy,
  isNewNodeId as isNew,
} from './node-id-decoder'

// Re-export Node ID decoder functions for offline ID conversion
export {
  decodeNodeId,
  extractDatabaseId,
  getNodeIdPrefix,
  getNodeIdType,
  isLegacyNodeId,
  isNewNodeId,
} from './node-id-decoder'
export type { DecodedNodeId } from './node-id-decoder'

export type GitHubEntityType = 'review-comment' | 'issue-comment' | 'issue' | 'pull-request'

/**
 * Get the gh command path from environment variable or use default
 * This allows tests to inject a mock gh command
 */
function getGhCommand(): string {
  return process.env.GH_PATH || 'gh'
}

/**
 * Detect if identifier is a Node ID (New or Legacy format)
 * New format: PRRC_xxx, IC_xxx, I_xxx, PR_xxx (prefix + Base64)
 * Legacy format: Base64-encoded "XXX:TypeNameDatabaseId"
 *
 * @param identifier - String to check
 * @returns True if identifier matches Node ID format
 */
export function isNodeId(identifier: string): boolean {
  return isNew(identifier) || isLegacy(identifier)
}

/**
 * Detect if identifier is a Database ID (positive integer)
 *
 * @param identifier - String to check
 * @returns True if identifier is a valid Database ID
 */
export function isDatabaseId(identifier: string): boolean {
  const id = Number.parseInt(identifier, 10)
  return !Number.isNaN(id) && id > 0 && identifier === id.toString()
}

/**
 * Validate comment identifier format
 * Accepts Database ID (positive integer) or Node ID (PRRC_xxx, IC_xxx, etc.)
 *
 * @param identifier - Comment identifier to validate
 * @returns The validated identifier
 * @throws Error if identifier format is invalid
 */
export function validateCommentIdentifier(identifier: string): string {
  if (isNodeId(identifier) || isDatabaseId(identifier)) {
    return identifier
  }

  throw new Error(
    `Invalid comment identifier: "${identifier}". `
    + 'Expected Database ID (positive integer) or Node ID (e.g., PRRC_xxx, IC_xxx)',
  )
}

/**
 * Convert PR review comment identifier to Node ID
 * If already a Node ID, returns it as-is
 * If Database ID, fetches comment list from REST API and extracts node_id
 *
 * @param identifier - Database ID (number string) or Node ID (PRRC_...)
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param prNumber - Pull request number
 * @returns Node ID string
 * @throws Error if comment not found or API call fails
 */
export async function toReviewCommentNodeId(
  identifier: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<string> {
  // If already a Node ID, return as-is
  if (isNodeId(identifier)) {
    return identifier
  }

  // Validate it's a Database ID
  if (!isDatabaseId(identifier)) {
    throw new Error(`Invalid identifier: ${identifier}`)
  }

  const databaseId = Number.parseInt(identifier, 10)

  // Fetch all PR review comments from REST API (includes node_id field)
  const endpoint = `/repos/${owner}/${repo}/pulls/${prNumber}/comments`

  const proc = Bun.spawn(
    [
      getGhCommand(),
      'api',
      '-H',
      'Accept: application/vnd.github+json',
      '-H',
      'X-GitHub-Api-Version: 2022-11-28',
      endpoint,
    ],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to fetch PR comments: ${error.trim()}`)
  }

  const comments = JSON.parse(output)

  // Find comment by database ID
  const comment = comments.find((c: any) => c.id === databaseId)

  if (!comment) {
    throw new Error(
      `Review comment ${databaseId} not found in PR #${prNumber} (${owner}/${repo})`,
    )
  }

  return comment.node_id
}

/**
 * Convert issue comment identifier to Node ID
 * If already a Node ID, returns it as-is
 * If Database ID, fetches comment list from REST API and extracts node_id
 *
 * @param identifier - Database ID (number string) or Node ID (IC_...)
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param issueNumber - Issue number
 * @returns Node ID string
 * @throws Error if comment not found or API call fails
 */
export async function toIssueCommentNodeId(
  identifier: string,
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<string> {
  // If already a Node ID, return as-is
  if (isNodeId(identifier)) {
    return identifier
  }

  // Validate it's a Database ID
  if (!isDatabaseId(identifier)) {
    throw new Error(`Invalid identifier: ${identifier}`)
  }

  const databaseId = Number.parseInt(identifier, 10)

  // Fetch all issue comments from REST API (includes node_id field)
  const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}/comments`

  const proc = Bun.spawn(
    [
      getGhCommand(),
      'api',
      '-H',
      'Accept: application/vnd.github+json',
      '-H',
      'X-GitHub-Api-Version: 2022-11-28',
      endpoint,
    ],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to fetch issue comments: ${error.trim()}`)
  }

  const comments = JSON.parse(output)

  // Find comment by database ID
  const comment = comments.find((c: any) => c.id === databaseId)

  if (!comment) {
    throw new Error(
      `Issue comment ${databaseId} not found in issue #${issueNumber} (${owner}/${repo})`,
    )
  }

  return comment.node_id
}
