/**
 * Plugin installation utilities
 *
 * Handles installing plugins via npm or from custom sources
 */

import { mkdir } from 'node:fs/promises'
import { checkGhAuth } from '../lib/gh-cli'
import { extractTarball, cleanupArchive } from '../lib/archive'
import { expandHome } from '../lib/path-utils'

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
 * Install a premium plugin
 * Requires authentication with GitHub CLI
 *
 * @param pluginName - Plugin name
 * @returns Installation result
 */
async function installPremiumPlugin(pluginName: string): Promise<InstallResult> {
  try {
    // 1. Check if user is authenticated with GitHub CLI
    const isAuthenticated = await checkGhAuth()
    if (!isAuthenticated) {
      return {
        success: false,
        pluginName,
        message: 'Authentication required for premium plugins',
        error: 'Run: gh auth login',
      }
    }

    // 2. Verify plugin exists in registry
    const repo = PREMIUM_PLUGIN_REPOS[pluginName]
    if (!repo) {
      return {
        success: false,
        pluginName,
        message: `Plugin '${pluginName}' not found in premium registry`,
        error: 'Unknown plugin name',
      }
    }

    // 3. Create installation directory
    const pluginDir = expandHome(`~/.gh-please/plugins/${pluginName}`)
    await mkdir(pluginDir, { recursive: true })

    // 4. Download latest release using gh CLI
    const downloadResult = await downloadRelease(repo, pluginDir)
    if (!downloadResult.success) {
      return {
        success: false,
        pluginName,
        message: `Failed to download ${pluginName} from ${repo}`,
        error: downloadResult.error,
      }
    }

    // 5. Extract tarball
    const extractResult = await extractPluginTarball(pluginDir)
    if (!extractResult.success) {
      return {
        success: false,
        pluginName,
        message: `Failed to extract ${pluginName}`,
        error: extractResult.error,
      }
    }

    // 6. Verify installation
    const verifyResult = await verifyPluginInstallation(pluginDir)
    if (!verifyResult.success) {
      return {
        success: false,
        pluginName,
        message: `Plugin ${pluginName} installation verification failed`,
        error: verifyResult.error,
      }
    }

    return {
      success: true,
      pluginName,
      message: `Plugin '${pluginName}' installed successfully to ${pluginDir}`,
    }
  }
  catch (error) {
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

    const stdout = await new Response(proc.stdout).text()
    const tarballPath = stdout.split('\n')[0]?.trim()

    if (!tarballPath) {
      return {
        success: false,
        error: 'No tarball found in plugin directory',
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

    const [stdout, stderr, exitCode] = await Promise.all([
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
