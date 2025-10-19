/**
 * Plugin installation utilities
 *
 * Handles installing plugins via npm or from custom sources
 */

import { spawn } from 'node:child_process'

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

    const result = await execCommand('npm', args)

    if (result.exitCode === 0) {
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
        error: result.stderr,
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
 * Install a premium plugin
 * Requires authentication with PleaseAI service
 *
 * @param pluginName - Plugin name
 * @returns Installation result
 */
async function installPremiumPlugin(pluginName: string): Promise<InstallResult> {
  // TODO: Implement premium plugin installation
  // This would involve:
  // 1. Checking PleaseAI account credentials
  // 2. Verifying subscription status
  // 3. Downloading plugin from private registry
  // 4. Installing to ~/.gh-please/plugins

  return {
    success: false,
    pluginName,
    message: 'Premium plugin installation not yet implemented',
    error: 'Please install manually from @pleaseai organization',
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

    const result = await execCommand('npm', args)

    if (result.exitCode === 0) {
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
        error: result.stderr,
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

/**
 * Execute a command and capture output
 *
 * @param command - Command to execute
 * @param args - Command arguments
 * @returns Command result
 */
function execCommand(
  command: string,
  args: string[],
): Promise<{ exitCode: number, stdout: string, stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
    })

    let stdout = ''
    let stderr = ''

    proc.stdout?.on('data', (data) => {
      const output = data.toString()
      stdout += output
      process.stdout.write(output)
    })

    proc.stderr?.on('data', (data) => {
      const output = data.toString()
      stderr += output
      process.stderr.write(output)
    })

    proc.on('close', (exitCode) => {
      resolve({
        exitCode: exitCode ?? 1,
        stdout,
        stderr,
      })
    })

    proc.on('error', (error) => {
      resolve({
        exitCode: 1,
        stdout,
        stderr: error.message,
      })
    })
  })
}
