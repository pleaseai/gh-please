/**
 * Get the gh command path from environment variable or use default
 * This allows tests to inject a mock gh command
 */
function getGhCommand(): string {
  return process.env.GH_PATH || 'gh'
}

/**
 * Check if GitHub CLI is authenticated
 *
 * Runs `gh auth status` to verify authentication status with GitHub.
 * This is a lightweight check that verifies if the gh CLI is properly configured.
 *
 * @returns Promise<boolean> - true if authenticated, false otherwise
 * @throws Error if gh CLI is not installed or if an unexpected error occurs
 *
 * @example
 * ```typescript
 * const isAuthenticated = await checkGhAuth()
 * if (isAuthenticated) {
 *   console.log('User is authenticated with GitHub')
 * } else {
 *   console.log('User is not authenticated')
 * }
 * ```
 */
export async function checkGhAuth(): Promise<boolean> {
  const proc = Bun.spawn([getGhCommand(), 'auth', 'status'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  // Consume stdout even though we don't use it
  await new Response(proc.stdout).text()
  const errorOutput = await new Response(proc.stderr).text()
  const exitCode = await proc.exited

  // Exit code 0 means authenticated
  if (exitCode === 0) {
    return true
  }

  // Exit code 1 typically means not authenticated
  if (exitCode === 1) {
    return false
  }

  // Exit code 127 usually means command not found
  if (exitCode === 127) {
    throw new Error(
      'GitHub CLI (gh) is not installed. '
      + 'Please install it from https://cli.github.com/',
    )
  }

  // Any other exit code is an unexpected error
  throw new Error(
    `Failed to check GitHub CLI authentication: ${errorOutput.trim() || `exit code ${exitCode}`}`,
  )
}

/**
 * Retrieve the GitHub authentication token
 *
 * Runs `gh auth token` to retrieve the current authentication token.
 * This can be useful for operations that require direct GitHub API access.
 *
 * @returns Promise<string | null> - The GitHub token if available, null if not authenticated or unavailable
 * @throws Error if gh CLI is not installed or if an unexpected error occurs
 *
 * @example
 * ```typescript
 * const token = await getGitHubToken()
 * if (token) {
 *   console.log('Token retrieved successfully')
 *   // Use token for direct API calls
 * } else {
 *   console.log('No token available - user may not be authenticated')
 * }
 * ```
 */
export async function getGitHubToken(): Promise<string | null> {
  const proc = Bun.spawn([getGhCommand(), 'auth', 'token'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const errorOutput = await new Response(proc.stderr).text()
  const exitCode = await proc.exited

  // Exit code 0 means token was retrieved successfully
  if (exitCode === 0) {
    const token = output.trim()
    return token || null
  }

  // Exit code 1 typically means not authenticated (no token available)
  if (exitCode === 1) {
    return null
  }

  // Exit code 127 usually means command not found
  if (exitCode === 127) {
    throw new Error(
      'GitHub CLI (gh) is not installed. '
      + 'Please install it from https://cli.github.com/',
    )
  }

  // Any other exit code is an unexpected error
  throw new Error(
    `Failed to retrieve GitHub token: ${errorOutput.trim() || `exit code ${exitCode}`}`,
  )
}
