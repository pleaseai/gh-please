/**
 * Get the gh command path from environment variable or use default
 * This allows tests to inject a mock gh command
 */
function getGhCommand(): string {
  return process.env.GH_PATH || 'gh'
}

/**
 * Internal result type for gh command execution
 */
interface GhCommandResult {
  stdout: string
  stderr: string
  exitCode: number
}

/**
 * Execute a gh CLI command and capture output
 * Reads stdout, stderr, and exit code in parallel for efficiency
 */
async function runGhCommand(args: string[]): Promise<GhCommandResult> {
  const proc = Bun.spawn([getGhCommand(), ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])

  return { stdout, stderr, exitCode }
}

/**
 * Handle common gh command errors with helpful messages
 */
function handleGhCommandError(commandName: string, stderr: string, exitCode: number): never {
  if (exitCode === 127) {
    throw new Error(
      'GitHub CLI (gh) is not installed. '
      + 'Please install it from https://cli.github.com/',
    )
  }

  throw new Error(
    `Failed to ${commandName}: ${stderr.trim() || `exit code ${exitCode}`}`,
  )
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
  const { stderr, exitCode } = await runGhCommand(['auth', 'status'])

  if (exitCode === 0) {
    console.log('[gh-cli] GitHub CLI authentication verified')
    return true
  }

  if (exitCode === 1) {
    console.warn('[gh-cli] GitHub CLI is not authenticated. Run: gh auth login')
    return false
  }

  console.error(`[gh-cli] Unexpected error checking authentication: ${stderr.trim() || `exit code ${exitCode}`}`)
  handleGhCommandError('check GitHub CLI authentication', stderr, exitCode)
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
  const { stdout, stderr, exitCode } = await runGhCommand(['auth', 'token'])

  if (exitCode === 0) {
    const token = stdout.trim()
    if (!token) {
      console.warn('[gh-cli] GitHub token command succeeded but returned empty token')
      return null
    }
    console.log('[gh-cli] GitHub token retrieved successfully')
    return token
  }

  if (exitCode === 1) {
    console.warn('[gh-cli] GitHub token not available. Run: gh auth login')
    return null
  }

  console.error(`[gh-cli] Failed to retrieve GitHub token: ${stderr.trim() || `exit code ${exitCode}`}`)
  handleGhCommandError('retrieve GitHub token', stderr, exitCode)
}
