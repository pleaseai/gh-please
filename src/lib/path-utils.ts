import { homedir } from 'node:os'

/**
 * Expand home directory path
 * Converts ~/path to full home directory path
 * Respects $HOME environment variable for testing
 *
 * @param filePath - Path that may start with ~
 * @returns Expanded path with ~ replaced by home directory
 *
 * @example
 * ```typescript
 * const pluginDir = expandHome('~/.gh-please/plugins/ai')
 * // Returns: /Users/username/.gh-please/plugins/ai
 * ```
 */
export function expandHome(filePath: string): string {
  if (!filePath.startsWith('~')) {
    return filePath
  }

  // Use HOME environment variable if available (for testing), otherwise use homedir
  const home = process.env.HOME || homedir()

  if (filePath === '~') {
    return home
  }

  // Replace ~/ with home directory
  return filePath.replace(/^~/, home)
}
