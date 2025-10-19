/**
 * Plugin system interfaces for gh-please
 *
 * This module defines the core plugin architecture that allows
 * extending gh-please with additional commands and functionality.
 */

import type { Command } from 'commander'

/**
 * Plugin type classification
 */
export type PluginType = 'command-group' | 'provider' | 'utility'

/**
 * Core plugin interface that all gh-please plugins must implement
 *
 * @example
 * ```typescript
 * export default {
 *   name: 'my-plugin',
 *   version: '1.0.0',
 *   type: 'command-group',
 *   registerCommands() {
 *     return [createMyCommand()]
 *   }
 * } as GhPleasePlugin
 * ```
 */
export interface GhPleasePlugin {
  /**
   * Plugin identifier (must be unique)
   * Used for loading and referencing the plugin
   */
  name: string

  /**
   * Semantic version of the plugin
   */
  version: string

  /**
   * Plugin type classification
   * - command-group: Adds new command groups (e.g., 'ai', 'spec')
   * - provider: Provides backend implementations (e.g., local AI providers)
   * - utility: Adds utility functions or helpers
   */
  type: PluginType

  /**
   * Register commands with the CLI
   *
   * @returns Array of Commander.js Command objects to add to the CLI
   */
  registerCommands(): Command[]

  /**
   * Optional initialization hook
   * Called after the plugin is loaded but before commands are registered
   *
   * @returns Promise that resolves when initialization is complete
   */
  init?(): Promise<void>

  /**
   * Optional metadata about the plugin
   */
  metadata?: PluginMetadata
}

/**
 * Plugin metadata for display and discovery
 */
export interface PluginMetadata {
  /**
   * Plugin author name or organization
   */
  author: string

  /**
   * Short description of what the plugin does
   */
  description: string

  /**
   * Homepage URL for the plugin
   */
  homepage?: string

  /**
   * Whether this plugin requires premium/paid access
   */
  premium?: boolean

  /**
   * Plugin license (e.g., 'MIT', 'Apache-2.0')
   */
  license?: string

  /**
   * Keywords for plugin discovery
   */
  keywords?: string[]
}

/**
 * Plugin information for listing and discovery
 */
export interface PluginInfo {
  name: string
  version: string
  type: PluginType
  description?: string
  author?: string
  premium?: boolean
  installed: boolean
  enabled: boolean
}

/**
 * Plugin package.json metadata
 * Used for discovering plugins in node_modules
 */
export interface PluginPackageJson {
  name: string
  version: string
  main?: string
  ghPleasePlugin?: {
    name: string
    type: PluginType
    enabled?: boolean
  }
}
