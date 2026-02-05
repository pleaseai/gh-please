/**
 * Result of a git command execution
 */
export interface GitResult {
  exitCode: number
  stdout: string
  stderr: string
}

/**
 * Execute a git command and return the result
 */
export async function runGitCommand(args: string[]): Promise<GitResult> {
  const proc = Bun.spawn(args, {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])

  return { exitCode, stdout, stderr }
}

/**
 * Log a warning with a follow-up message
 */
export function warnWithFollowup(message: string, followup: string): void {
  console.warn(`⚠️ Warning: ${message}`)
  console.warn(`   ${followup}`)
}
