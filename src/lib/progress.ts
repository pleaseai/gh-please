/**
 * Progress and status reporting utilities
 *
 * Provides functions for displaying user-friendly progress indicators
 * and status messages during long-running operations
 */

/**
 * Progress indicator for long-running operations
 */
export interface ProgressIndicator {
  start(message: string): void
  update(message: string): void
  success(message: string): void
  error(message: string): void
  info(message: string): void
}

/**
 * Create a simple progress indicator for the CLI
 */
export function createProgressIndicator(): ProgressIndicator {
  return {
    start(message: string): void {
      console.log(`📡 ${message}`)
    },
    update(message: string): void {
      console.log(`⏳ ${message}`)
    },
    success(message: string): void {
      console.log(`✅ ${message}`)
    },
    error(message: string): void {
      console.error(`❌ ${message}`)
    },
    info(message: string): void {
      console.log(`ℹ️  ${message}`)
    },
  }
}

/**
 * Display authenticated user information
 */
export function displayAuthenticatedUser(username: string): void {
  console.log(`✅ Authenticated as @${username}`)
}

/**
 * Display available commands after successful installation
 */
export function displayInstalledCommands(pluginName: string, commands: string[]): void {
  console.log('')
  console.log('Available commands:')

  for (const command of commands) {
    console.log(`  ${command}`)
  }

  console.log('')
  console.log(`Run 'gh please ${pluginName} --help' for more information.`)
}

/**
 * Display authentication error message with recovery instructions
 */
export function displayAuthError(): void {
  console.error('❌ Not authenticated with GitHub')
  console.log('Please authenticate first:')
  console.log('  gh auth login')
  console.log('Then try again:')
  console.log('  gh please plugin install ai --premium')
}

/**
 * Display repository access error message
 */
export function displayRepoAccessError(repo: string): void {
  console.error(`❌ Repository not found or access denied`)
  console.log('Verify access:')
  console.log(`  gh repo view ${repo}`)
}

/**
 * Display installation completion message
 */
export function displayInstallationComplete(pluginName: string): void {
  console.log(`✅ Plugin '${pluginName}' installed successfully!`)
  console.log('')
  console.log('💡 Next steps:')
  console.log('  1. Reload your shell: hash -r')
  console.log(`  2. Try: gh please ${pluginName} --help`)
}

/**
 * Display generic installation error with recovery steps
 */
export function displayGenericInstallError(error: string): void {
  console.error(`❌ Installation failed: ${error}`)
  console.log('')
  console.log('💡 Troubleshooting:')
  console.log('  1. Check your internet connection')
  console.log('  2. Verify GitHub CLI is installed: gh --version')
  console.log('  3. Check GitHub authentication: gh auth status')
  console.log('  4. Try installing again: gh please plugin install <name>')
}
