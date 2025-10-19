/**
 * Plugin installation utilities
 *
 * Handles installing plugins via npm or from custom sources
 */

import { mkdir } from 'node:fs/promises'
import { cleanupArchive, extractTarball } from '../lib/archive'
import { checkGhAuth } from '../lib/gh-cli'
import { expandHome } from '../lib/path-utils'
import {
  createProgressIndicator,
  displayAuthError,
  displayGenericInstallError,
  displayInstallationComplete,
  displayRepoAccessError,
} from '../lib/progress'

/**
 * Plugin installation result
 */
export interface InstallResult {
  success: boolean
  pluginName: string
  message: string
  error?: string
}

/**
 * Install a plugin from npm
 *
 * @param pluginName - Name of the plugin package to install
 * @param options - Installation options
 * @param options.global - Install globally (default: true)
 * @param options.premium - Install as premium plugin (default: false)
 * @returns Installation result
 */
export async function installPlugin(
  pluginName: string,
  options: {
    global?: boolean
    premium?: boolean
  } = {},
): Promise<InstallResult> {
  const { global = true, premium = false } = options

  // Premium plugins require authentication
  if (premium) {
    return installPremiumPlugin(pluginName)
  }

  // Install from npm
  return installFromNpm(pluginName, global)
}

/**
 * Uninstall a plugin
 *
 * @param pluginName - Name of the plugin to uninstall
 * @param options - Uninstallation options
 * @param options.global - Uninstall globally (default: true)
 * @returns Uninstallation result
 */
export async function uninstallPlugin(
  pluginName: string,
  options: {
    global?: boolean
  } = {},
): Promise<InstallResult> {
  const { global = true } = options

  try {
    const args = global ? ['uninstall', '-g', pluginName] : ['uninstall', pluginName]

    const proc = Bun.spawn(['npm', ...args], {
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const [stderr, exitCode] = await Promise.all([
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    if (exitCode === 0) {
      return {
        success: true,
        pluginName,
        message: `Plugin '${pluginName}' uninstalled successfully`,
      }
    }
    else {
      return {
        success: false,
        pluginName,
        message: `Failed to uninstall plugin '${pluginName}'`,
        error: stderr,
      }
    }
  }
  catch (error) {
    return {
      success: false,
      pluginName,
      message: `Failed to uninstall plugin '${pluginName}'`,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Map of premium plugin names to their GitHub repositories
 */
const PREMIUM_PLUGIN_REPOS: Record<string, string> = {
  ai: 'pleaseai/gh-please-ai',
}

/**
 * Validate plugin name for security and safety
 * Only allows alphanumeric characters, hyphens, and underscores
 * Prevents path traversal and special character injection
 *
 * @param pluginName - Plugin name to validate
 * @throws Error if validation fails
 */
function validatePluginName(pluginName: string): void {
  if (!pluginName || pluginName.trim().length === 0) {
    throw new Error('Plugin name cannot be empty')
  }

  // Prevent path traversal and special characters
  if (pluginName.includes('/') || pluginName.includes('\\') || pluginName.includes('..')) {
    throw new Error('Invalid plugin name: contains path traversal characters')
  }

  // Only allow alphanumeric, hyphen, underscore
  if (!/^[\w-]+$/.test(pluginName)) {
    throw new Error('Invalid plugin name: only alphanumeric, hyphen, and underscore allowed')
  }
}

/**
 * Install a premium plugin
 * Requires authentication with GitHub CLI
 *
 * @param pluginName - Plugin name (e.g., 'ai')
 * @returns Installation result
 *
 * @example
 * ```typescript
 * const result = await installPremiumPlugin('ai')
 * if (result.success) {
 *   console.log('Installed:', result.message)
 * } else {
 *   console.error('Failed:', result.error)
 * }
 * ```
 */
async function installPremiumPlugin(pluginName: string): Promise<InstallResult> {
  const progress = createProgressIndicator()

  try {
    // 0. Validate plugin name for security
    validatePluginName(pluginName)

    console.log(`🔒 Installing premium plugin: ${pluginName}`)
    console.log('')

    // 1. Check if user is authenticated with GitHub CLI
    progress.start('Checking GitHub authentication...')
    const isAuthenticated = await checkGhAuth()
    if (!isAuthenticated) {
      console.log('')
      displayAuthError()
      return {
        success: false,
        pluginName,
        message: 'Not authenticated with GitHub',
        error: 'Run: gh auth login',
      }
    }
    progress.success('Authenticated with GitHub')

    // 2. Verify plugin exists in registry
    const repo = PREMIUM_PLUGIN_REPOS[pluginName]
    if (!repo) {
      console.log('')
      progress.error(`Plugin '${pluginName}' not found in premium registry`)
      console.log('Available premium plugins: ai')
      return {
        success: false,
        pluginName,
        message: `Plugin '${pluginName}' not found in premium registry`,
        error: 'Unknown plugin name',
      }
    }

    // 3. Create installation directory
    const pluginDir = expandHome(`~/.gh-please/plugins/${pluginName}`)
    progress.update(`Creating installation directory...`)
    await mkdir(pluginDir, { recursive: true })

    // 4. Download latest release using gh CLI
    progress.start(`Downloading from ${repo}...`)
    const downloadResult = await downloadRelease(repo, pluginDir)
    if (!downloadResult.success) {
      console.log('')
      displayRepoAccessError(repo)
      console.log('')
      console.log(`Details: ${downloadResult.error}`)
      return {
        success: false,
        pluginName,
        message: `Failed to download ${pluginName} from ${repo}`,
        error: downloadResult.error,
      }
    }
    progress.success(`Downloaded successfully`)

    // 5. Extract tarball
    progress.update(`Extracting to ${pluginDir}...`)
    const extractResult = await extractPluginTarball(pluginDir)
    if (!extractResult.success) {
      console.log('')
      progress.error(`Failed to extract ${pluginName}`)
      console.log(`Details: ${extractResult.error}`)
      return {
        success: false,
        pluginName,
        message: `Failed to extract ${pluginName}`,
        error: extractResult.error,
      }
    }
    progress.success(`Extracted successfully`)

    // 6. Verify installation
    progress.update(`Verifying installation...`)
    const verifyResult = await verifyPluginInstallation(pluginDir)
    if (!verifyResult.success) {
      console.log('')
      progress.error(`Plugin installation verification failed`)
      console.log(`Details: ${verifyResult.error}`)
      return {
        success: false,
        pluginName,
        message: `Plugin ${pluginName} installation verification failed`,
        error: verifyResult.error,
      }
    }

    console.log('')
    displayInstallationComplete(pluginName)

    return {
      success: true,
      pluginName,
      message: `Plugin '${pluginName}' installed successfully to ${pluginDir}`,
    }
  }
  catch (error) {
    console.log('')
    displayGenericInstallError(
      error instanceof Error ? error.message : 'Unknown error',
      true,
    )
    return {
      success: false,
      pluginName,
      message: `Failed to install premium plugin '${pluginName}'`,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get the gh command path from environment (for testing)
 */
function getGhCommand(): string {
  return process.env.GH_PATH || 'gh'
}

/**
 * Download release from GitHub repository
 */
async function downloadRelease(
  repo: string,
  targetDir: string,
): Promise<{ success: boolean, error?: string }> {
  try {
    const ghCommand = getGhCommand()
    const proc = Bun.spawn([ghCommand, 'release', 'download', '--repo', repo, '--pattern', '*.tar.gz', '--dir', targetDir, '--clobber'], {
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const [stderr, exitCode] = await Promise.all([
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    if (exitCode !== 0) {
      return {
        success: false,
        error: stderr.trim() || `gh release download exited with code ${exitCode}`,
      }
    }

    return { success: true }
  }
  catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during download',
    }
  }
}

/**
 * Extract plugin tarball in the plugin directory
 */
async function extractPluginTarball(pluginDir: string): Promise<{ success: boolean, error?: string }> {
  try {
    // Find the first .tar.gz file in the directory using find command
    const proc = Bun.spawn(['find', pluginDir, '-name', '*.tar.gz', '-type', 'f'], {
      stdout: 'pipe',
      stderr: 'pipe',
    })

    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    // Check if find command itself failed
    if (exitCode !== 0) {
      return {
        success: false,
        error: `Failed to find tarball in ${pluginDir}: ${stderr.trim() || `find exited with code ${exitCode}`}`,
      }
    }

    const tarballPath = stdout.split('\n')[0]?.trim()

    if (!tarballPath) {
      return {
        success: false,
        error: `No .tar.gz files found in directory: ${pluginDir}`,
      }
    }

    // Extract the tarball
    await extractTarball(tarballPath, pluginDir)

    // Cleanup the tarball
    await cleanupArchive(tarballPath)

    return { success: true }
  }
  catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during extraction',
    }
  }
}

/**
 * Verify plugin installation by checking for package.json
 */
async function verifyPluginInstallation(pluginDir: string): Promise<{ success: boolean, error?: string }> {
  try {
    const packageJsonPath = `${pluginDir}/package.json`
    const file = Bun.file(packageJsonPath)

    if (await file.exists()) {
      return { success: true }
    }

    return {
      success: false,
      error: 'package.json not found in plugin directory',
    }
  }
  catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during verification',
    }
  }
}

/**
 * Install a plugin from npm
 *
 * @param packageName - npm package name
 * @param global - Install globally
 * @returns Installation result
 */
async function installFromNpm(packageName: string, global: boolean): Promise<InstallResult> {
  try {
    const args = global ? ['install', '-g', packageName] : ['install', packageName]

    console.log(`📦 Installing ${packageName}...`)

    const proc = Bun.spawn(['npm', ...args], {
      stdio: ['inherit', 'pipe', 'pipe'],
    })

    const [_stdout, stderr, exitCode] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ])

    if (exitCode === 0) {
      return {
        success: true,
        pluginName: packageName,
        message: `Plugin '${packageName}' installed successfully`,
      }
    }
    else {
      return {
        success: false,
        pluginName: packageName,
        message: `Failed to install plugin '${packageName}'`,
        error: stderr,
      }
    }
  }
  catch (error) {
    return {
      success: false,
      pluginName: packageName,
      message: `Failed to install plugin '${packageName}'`,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
