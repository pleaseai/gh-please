import type { CommentInfo, ReviewCommentInfo } from '../types'

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

/**
 * Internal helper to fetch paginated comments from GitHub API
 * @param endpoint - API endpoint to fetch from
 * @param errorMessage - Error message to throw on failure
 * @returns Array of comments
 */
async function fetchPaginatedComments<T>(
  endpoint: string,
  errorMessage: string,
): Promise<T[]> {
  const proc = Bun.spawn(
    [
      getGhCommand(),
      'api',
      '-H',
      'Accept: application/vnd.github+json',
      '-H',
      'X-GitHub-Api-Version: 2022-11-28',
      endpoint,
      '--paginate',
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
    throw new Error(`${errorMessage}: ${error.trim()}`)
  }

  return JSON.parse(output)
}

/**
 * List all comments for an issue
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param issueNumber - Issue number
 * @returns Array of comment information
 */
export async function listIssueComments(
  owner: string,
  repo: string,
  issueNumber: number,
): Promise<CommentInfo[]> {
  const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}/comments`
  return fetchPaginatedComments<CommentInfo>(
    endpoint,
    `Failed to list comments for issue #${issueNumber}`,
  )
}

/**
 * List all review comments for a pull request
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param prNumber - Pull request number
 * @returns Array of review comment information
 */
export async function listReviewComments(
  owner: string,
  repo: string,
  prNumber: number,
): Promise<ReviewCommentInfo[]> {
  const endpoint = `/repos/${owner}/${repo}/pulls/${prNumber}/comments`
  return fetchPaginatedComments<ReviewCommentInfo>(
    endpoint,
    `Failed to list review comments for PR #${prNumber}`,
  )
}
