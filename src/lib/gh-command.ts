/**
 * Get the gh command path from environment variable or use default
 */
export function getGhCommand(): string {
  return process.env.GH_PATH || 'gh'
}
