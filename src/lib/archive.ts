import { existsSync, mkdirSync, rmSync } from 'node:fs'

/**
 * Extract a tarball archive to a target directory
 * @param filePath - Path to the .tar.gz file
 * @param targetDir - Directory to extract contents into
 * @throws Error if extraction fails
 */
export async function extractTarball(
  filePath: string,
  targetDir: string,
): Promise<void> {
  // Validate tarball exists
  if (!existsSync(filePath)) {
    throw new Error(`Tarball not found: ${filePath}`)
  }

  // Create target directory if it doesn't exist
  try {
    mkdirSync(targetDir, { recursive: true })
  }
  catch (error) {
    throw new Error(
      `Failed to create target directory: ${targetDir}. ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  // Extract tarball using tar command
  const proc = Bun.spawn(['tar', '-xzf', filePath, '-C', targetDir], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text()
    throw new Error(`Failed to extract tarball: ${stderr}`)
  }
}

/**
 * Remove a tarball archive file
 * @param filePath - Path to the tarball file to remove
 */
export async function cleanupArchive(filePath: string): Promise<void> {
  if (existsSync(filePath)) {
    rmSync(filePath, { force: true })
  }
}

/**
 * Validate that a file is a valid tarball archive
 * @param filePath - Path to the tarball file
 * @returns true if valid, false otherwise
 */
export async function validateTarball(filePath: string): Promise<boolean> {
  // Check if file exists
  if (!existsSync(filePath)) {
    return false
  }

  // Test tarball integrity using tar -tzf (list contents)
  const proc = Bun.spawn(['tar', '-tzf', filePath], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const exitCode = await proc.exited
  return exitCode === 0
}
