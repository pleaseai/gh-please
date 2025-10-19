/**
 * Plugin registry and loader
 *
 * Responsible for discovering, loading, and managing plugins
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { GhPleasePlugin, PluginInfo, PluginPackageJson } from './plugin-interface'

/**
 * Central registry for managing plugins
 */
export class PluginRegistry {
  private plugins = new Map<string, GhPleasePlugin>()
  private pluginPaths = new Map<string, string>()

  /**
   * Load all available plugins
   *
   * Scans for plugins in:
   * 1. node_modules (packages with ghPleasePlugin in package.json)
   * 2. ~/.gh-please/plugins (local plugin directory)
   */
  async loadPlugins(): Promise<void> {
    // Load from node_modules
    await this.loadFromNodeModules()

    // Load from local plugins directory
    await this.loadFromLocalDir()
  }

  /**
   * Register a plugin manually
   *
   * @param plugin - Plugin instance to register
   * @param path - Optional path to the plugin
   */
  register(plugin: GhPleasePlugin, path?: string): void {
    this.plugins.set(plugin.name, plugin)
    if (path) {
      this.pluginPaths.set(plugin.name, path)
    }
  }

  /**
   * Get a plugin by name
   *
   * @param name - Plugin name
   * @returns Plugin instance or undefined if not found
   */
  get(name: string): GhPleasePlugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * Check if a plugin is loaded
   *
   * @param name - Plugin name
   * @returns true if plugin is loaded
   */
  has(name: string): boolean {
    return this.plugins.has(name)
  }

  /**
   * Get all loaded plugins
   *
   * @returns Array of plugin instances
   */
  getAll(): GhPleasePlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * List all plugins with metadata
   *
   * @returns Array of plugin information
   */
  listAll(): PluginInfo[] {
    return Array.from(this.plugins.values()).map(plugin => ({
      name: plugin.name,
      version: plugin.version,
      type: plugin.type,
      description: plugin.metadata?.description,
      author: plugin.metadata?.author,
      premium: plugin.metadata?.premium ?? false,
      installed: true,
      enabled: true,
    }))
  }

  /**
   * Unregister a plugin
   *
   * @param name - Plugin name
   * @returns true if plugin was removed
   */
  unregister(name: string): boolean {
    this.pluginPaths.delete(name)
    return this.plugins.delete(name)
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear()
    this.pluginPaths.clear()
  }

  /**
   * Load plugins from node_modules
   *
   * Scans node_modules for packages with ghPleasePlugin in package.json
   */
  private async loadFromNodeModules(): Promise<void> {
    try {
      const nodeModulesPath = join(process.cwd(), 'node_modules')
      const packages = await this.scanNodeModules(nodeModulesPath)

      for (const pkg of packages) {
        await this.loadPlugin(pkg.path, pkg.name)
      }
    }
    catch (error) {
      // node_modules might not exist, that's ok
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Failed to scan node_modules for plugins:', error)
      }
    }
  }

  /**
   * Load plugins from ~/.gh-please/plugins
   */
  private async loadFromLocalDir(): Promise<void> {
    try {
      const homeDir = process.env.HOME || process.env.USERPROFILE
      if (!homeDir)
        return

      const pluginsDir = join(homeDir, '.gh-please', 'plugins')
      const entries = await readdir(pluginsDir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = join(pluginsDir, entry.name)
          await this.loadPlugin(pluginPath, entry.name)
        }
      }
    }
    catch (error) {
      // Local plugins directory might not exist, that's ok
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('Failed to load local plugins:', error)
      }
    }
  }

  /**
   * Scan node_modules for plugin packages
   *
   * @param nodeModulesPath - Path to node_modules directory
   * @returns Array of plugin package information
   */
  private async scanNodeModules(nodeModulesPath: string): Promise<Array<{ name: string, path: string }>> {
    const plugins: Array<{ name: string, path: string }> = []

    try {
      const entries = await readdir(nodeModulesPath, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packagePath = join(nodeModulesPath, entry.name)

          // Handle scoped packages (@org/package)
          if (entry.name.startsWith('@')) {
            const scopedEntries = await readdir(packagePath, { withFileTypes: true })
            for (const scopedEntry of scopedEntries) {
              if (scopedEntry.isDirectory()) {
                const scopedPackagePath = join(packagePath, scopedEntry.name)
                const pluginInfo = await this.checkForPlugin(scopedPackagePath)
                if (pluginInfo) {
                  plugins.push(pluginInfo)
                }
              }
            }
          }
          else {
            const pluginInfo = await this.checkForPlugin(packagePath)
            if (pluginInfo) {
              plugins.push(pluginInfo)
            }
          }
        }
      }
    }
    catch (error) {
      // Ignore errors, directory might not exist
    }

    return plugins
  }

  /**
   * Check if a package is a gh-please plugin
   *
   * @param packagePath - Path to package directory
   * @returns Plugin info if it's a plugin, null otherwise
   */
  private async checkForPlugin(packagePath: string): Promise<{ name: string, path: string } | null> {
    try {
      const packageJsonPath = join(packagePath, 'package.json')
      const packageJsonContent = await readFile(packageJsonPath, 'utf-8')
      const packageJson = JSON.parse(packageJsonContent) as PluginPackageJson

      // Check if package has ghPleasePlugin metadata
      if (packageJson.ghPleasePlugin) {
        return {
          name: packageJson.ghPleasePlugin.name || packageJson.name,
          path: packagePath,
        }
      }
    }
    catch (error) {
      // Package might not have package.json or it's malformed
    }

    return null
  }

  /**
   * Load a plugin from a path
   *
   * @param pluginPath - Path to plugin directory or file
   * @param pluginName - Plugin name for error reporting
   */
  private async loadPlugin(pluginPath: string, pluginName: string): Promise<void> {
    try {
      // Try to import the plugin
      // Note: In production, this would use dynamic import()
      // For now, we'll just store the path for manual loading
      this.pluginPaths.set(pluginName, pluginPath)

      // In a real implementation with ESM:
      // const module = await import(pluginPath)
      // const plugin = module.default as GhPleasePlugin
      // await plugin.init?.()
      // this.register(plugin, pluginPath)
    }
    catch (error) {
      console.warn(`Failed to load plugin '${pluginName}':`, error)
    }
  }
}
