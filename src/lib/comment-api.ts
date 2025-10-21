import type { CommentInfo } from '../types'

/**
 * Get the gh command path from environment variable or use default
 * This allows tests to inject a mock gh command
 */
function getGhCommand(): string {
  return process.env.GH_PATH || 'gh'
}

/**
 * Get an issue comment by ID
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param commentId - Issue comment ID
 * @returns Comment information
 */
export async function getIssueComment(
  owner: string,
  repo: string,
  commentId: number,
): Promise<CommentInfo> {
  const endpoint = `/repos/${owner}/${repo}/issues/comments/${commentId}`

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
    throw new Error(`Failed to fetch issue comment ${commentId}: ${error.trim()}`)
  }

  return JSON.parse(output)
}

/**
 * Update an issue comment
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param commentId - Issue comment ID
 * @param body - New comment body
 */
export async function updateIssueComment(
  owner: string,
  repo: string,
  commentId: number,
  body: string,
): Promise<void> {
  const endpoint = `/repos/${owner}/${repo}/issues/comments/${commentId}`

  const proc = Bun.spawn(
    [
      getGhCommand(),
      'api',
      '--method',
      'PATCH',
      '-H',
      'Accept: application/vnd.github+json',
      '-H',
      'X-GitHub-Api-Version: 2022-11-28',
      endpoint,
      '-f',
      `body=${body}`,
    ],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to update issue comment ${commentId}: ${error.trim()}`)
  }
}

/**
 * Get a PR review comment by ID
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param commentId - Review comment ID
 * @returns Comment information
 */
export async function getReviewComment(
  owner: string,
  repo: string,
  commentId: number,
): Promise<CommentInfo> {
  const endpoint = `/repos/${owner}/${repo}/pulls/comments/${commentId}`

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
    throw new Error(`Failed to fetch review comment ${commentId}: ${error.trim()}`)
  }

  return JSON.parse(output)
}

/**
 * Update a PR review comment
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param commentId - Review comment ID
 * @param body - New comment body
 */
export async function updateReviewComment(
  owner: string,
  repo: string,
  commentId: number,
  body: string,
): Promise<void> {
  const endpoint = `/repos/${owner}/${repo}/pulls/comments/${commentId}`

  const proc = Bun.spawn(
    [
      getGhCommand(),
      'api',
      '--method',
      'PATCH',
      '-H',
      'Accept: application/vnd.github+json',
      '-H',
      'X-GitHub-Api-Version: 2022-11-28',
      endpoint,
      '-f',
      `body=${body}`,
    ],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    },
  )

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to update review comment ${commentId}: ${error.trim()}`)
  }
}
