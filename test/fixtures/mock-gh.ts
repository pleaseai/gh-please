import { chmodSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Create a mock gh CLI script for testing
 * @param scenario - The test scenario to simulate
 * @returns Path to the mock script
 */
export function createMockGhScript(scenario: string, tmpDir: string): string {
  const scriptPath = join(tmpDir, 'mock-gh')

  let scriptContent = '#!/usr/bin/env bash\n'

  switch (scenario) {
    case 'auth-status-success':
      scriptContent += `
echo "Logged in to github.com as testuser"
exit 0
`
      break

    case 'auth-status-not-authenticated':
      scriptContent += `
echo "You are not logged into any GitHub hosts. Run gh auth login to authenticate." >&2
exit 1
`
      break

    case 'auth-token-success':
      scriptContent += `
echo "gho_1234567890abcdefghijklmnopqrstuvwxyz"
exit 0
`
      break

    case 'auth-token-not-authenticated':
      scriptContent += `
echo "gh: Not logged into any GitHub hosts. Run gh auth login to authenticate." >&2
exit 1
`
      break

    case 'auth-token-empty':
      scriptContent += `
echo ""
exit 0
`
      break

    case 'exit-127':
      scriptContent += `
exit 127
`
      break

    case 'exit-2':
      scriptContent += `
echo "Unexpected error" >&2
exit 2
`
      break

    default:
      throw new Error(`Unknown mock scenario: ${scenario}`)
  }

  writeFileSync(scriptPath, scriptContent, { mode: 0o755 })
  chmodSync(scriptPath, 0o755)

  return scriptPath
}
