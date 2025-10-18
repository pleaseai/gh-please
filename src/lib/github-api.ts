import type { PrInfo, ReplyOptions, ReviewComment } from '../types'

/**
 * Get the gh command path from environment variable or use default
 * This allows tests to inject a mock gh command
 */
function getGhCommand(): string {
  return process.env.GH_PATH || 'gh'
}

/**
 * Parse PR info from gh CLI output
 */
export function parsePrInfo(data: any): PrInfo {
  return {
    number: data.number,
    owner: data.owner?.login || data.owner,
    repo: data.repository?.name || data.repository,
  }
}

/**
 * Build endpoint for getting a review comment
 */
export function buildGetCommentEndpoint(prInfo: PrInfo, commentId: number): string {
  const { owner, repo, number } = prInfo
  return `/repos/${owner}/${repo}/pulls/${number}/comments/${commentId}`
}

/**
 * Build endpoint for creating a reply
 */
export function buildReplyEndpoint(prInfo: PrInfo, commentId: number): string {
  const { owner, repo, number } = prInfo
  return `/repos/${owner}/${repo}/pulls/${number}/comments/${commentId}/replies`
}

/**
 * Check if a comment is a top-level review comment
 */
export function isTopLevelComment(comment: ReviewComment): boolean {
  return comment.line !== null
}

/**
 * Get current PR information using gh CLI
 */
export async function getCurrentPrInfo(): Promise<PrInfo> {
  const proc = Bun.spawn([getGhCommand(), 'pr', 'view', '--json', 'number,owner,repository'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to get PR info: ${error.trim() || 'Not in a PR context'}`)
  }

  const data = JSON.parse(output)
  return parsePrInfo(data)
}

/**
 * Get a specific review comment by ID
 */
export async function getReviewComment(
  prInfo: PrInfo,
  commentId: number,
): Promise<ReviewComment> {
  const endpoint = buildGetCommentEndpoint(prInfo, commentId)

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
    throw new Error(`Failed to fetch comment ${commentId}: ${error.trim()}`)
  }

  return JSON.parse(output)
}

/**
 * Create a reply to a review comment
 */
export async function createReviewReply(options: ReplyOptions): Promise<void> {
  const { commentId, body, prInfo } = options

  // Validate that comment exists and is a top-level review comment
  const comment = await getReviewComment(prInfo, commentId)

  if (!isTopLevelComment(comment)) {
    // This might be a reply to a comment, not a top-level comment
    console.warn('⚠️  Warning: This comment might not be a top-level review comment.')
    console.warn('   Replies to replies are not supported by GitHub API.')
  }

  const endpoint = buildReplyEndpoint(prInfo, commentId)

  const proc = Bun.spawn(
    [
      getGhCommand(),
      'api',
      '--method',
      'POST',
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

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to create reply: ${error.trim()}`)
  }

  const reply = JSON.parse(output)
  console.log(`✅ Reply created successfully!`)
  console.log(`   Comment ID: ${reply.id}`)
  console.log(`   View: ${reply.html_url}`)
}

/**
 * Get repository information (owner and name) from current context
 */
export async function getRepoInfo(): Promise<{ owner: string, repo: string }> {
  const proc = Bun.spawn([getGhCommand(), 'repo', 'view', '--json', 'owner,name'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to get repo info: ${error.trim() || 'Not in a repository'}`)
  }

  const data = JSON.parse(output)
  return {
    owner: data.owner?.login || data.owner,
    repo: data.name,
  }
}

/**
 * Create a comment on an issue
 */
export async function createIssueComment(
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<number> {
  const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}/comments`

  const proc = Bun.spawn(
    [
      getGhCommand(),
      'api',
      '--method',
      'POST',
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

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to create issue comment: ${error.trim()}`)
  }

  const comment = JSON.parse(output)
  return comment.id
}

/**
 * Create a comment on a pull request
 */
export async function createPrComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
): Promise<number> {
  const endpoint = `/repos/${owner}/${repo}/issues/${prNumber}/comments`

  const proc = Bun.spawn(
    [
      getGhCommand(),
      'api',
      '--method',
      'POST',
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

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to create PR comment: ${error.trim()}`)
  }

  const comment = JSON.parse(output)
  return comment.id
}
