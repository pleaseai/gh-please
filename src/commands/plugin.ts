/**
 * Plugin management commands
 *
 * Provides commands for listing, installing, and managing plugins
 */

import { Command } from 'commander'
import { installPlugin, uninstallPlugin } from '../plugins/plugin-installer'
import { PluginRegistry } from '../plugins/plugin-registry'

/**
 * Create the plugin command group
 *
 * @returns Command object for plugin management
 */
export function createPluginCommand(): Command {
  const command = new Command('plugin')

  command.description('Manage gh-please plugins')

  // plugin list
  command
    .command('list')
    .description('List installed plugins')
    .action(async () => {
      const registry = new PluginRegistry()
      await registry.loadPlugins()

      const plugins = registry.listAll()

      if (plugins.length === 0) {
        console.log('📦 No plugins installed')
        console.log('')
        console.log('💡 Available plugins:')
        console.log('   • ai (premium)    - AI-powered automation')
        console.log('   • speckit         - Spec document management')
        console.log('')
        console.log('Install with: gh please plugin install <name>')
        return
      }

      console.log('📦 Installed plugins:\n')

      for (const plugin of plugins) {
        const premiumBadge = plugin.premium ? '🔒' : '✅'
        const typeBadge = `[${plugin.type}]`

        console.log(`${premiumBadge} ${plugin.name} v${plugin.version} ${typeBadge}`)

        if (plugin.description) {
          console.log(`   ${plugin.description}`)
        }

        if (plugin.author) {
          console.log(`   by ${plugin.author}`)
        }

        console.log('')
      }
    })

  // plugin search
  command
    .command('search')
    .description('Search for available plugins')
    .argument('[query]', 'Search query (optional)')
    .action(async (query?: string) => {
      console.log('🔍 Available gh-please plugins:\n')

      // Hardcoded list for now - in production this would query a registry
      const availablePlugins = [
        {
          name: 'ai',
          description: 'AI-powered code review and issue automation',
          author: 'PleaseAI',
          premium: true,
          package: '@pleaseai/gh-please-ai',
        },
        {
          name: 'speckit',
          description: 'Spec document management and synchronization',
          author: 'Community',
          premium: false,
          package: 'gh-please-plugin-speckit',
        },
        {
          name: 'linear',
          description: 'Linear issue tracker integration',
          author: 'Community',
          premium: false,
          package: 'gh-please-plugin-linear',
        },
        {
          name: 'jira',
          description: 'Jira integration for gh-please',
          author: 'Community',
          premium: false,
          package: 'gh-please-plugin-jira',
        },
      ]

      const filtered = query
        ? availablePlugins.filter(p =>
            p.name.includes(query)
            || p.description.toLowerCase().includes(query.toLowerCase()),
          )
        : availablePlugins

      if (filtered.length === 0) {
        console.log(`No plugins found matching '${query}'`)
        return
      }

      for (const plugin of filtered) {
        const badge = plugin.premium ? '🔒 premium' : '✅ free'
        console.log(`${plugin.name} (${badge})`)
        console.log(`   ${plugin.description}`)
        console.log(`   by ${plugin.author}`)
        console.log(`   Install: gh please plugin install ${plugin.name}`)
        console.log('')
      }
    })

  // plugin install
  command
    .command('install')
    .description('Install a plugin')
    .argument('<name>', 'Plugin name to install')
    .option('--premium', 'Install as premium plugin (requires authentication)')
    .option('--local', 'Install locally instead of globally')
    .action(async (name: string, options: { premium?: boolean, local?: boolean }) => {
      const { premium = false, local = false } = options

      // Map plugin names to package names
      const packageMap: Record<string, string> = {
        ai: '@pleaseai/gh-please-ai',
        speckit: 'gh-please-plugin-speckit',
        linear: 'gh-please-plugin-linear',
        jira: 'gh-please-plugin-jira',
      }

      const packageName = packageMap[name] || name

      if (premium && name !== 'ai') {
        console.error(`❌ Plugin '${name}' is not a premium plugin`)
        console.log('   Premium plugins: ai')
        process.exit(1)
      }

      if (premium) {
        console.log('🔒 Premium plugin installation')
        console.log('')
        console.log('Premium plugins require a PleaseAI subscription.')
        console.log('Visit: https://please.ai/pricing')
        console.log('')
        console.log('For self-hosted installation:')
        console.log(`   npm install -g ${packageName}`)
        return
      }

      const result = await installPlugin(packageName, { global: !local, premium })

      if (result.success) {
        console.log(`✅ ${result.message}`)
        console.log('')
        console.log('Plugin installed successfully!')
        console.log('Restart your terminal or run: hash -r')
      }
      else {
        console.error(`❌ ${result.message}`)
        if (result.error) {
          console.error(`   ${result.error}`)
        }
        process.exit(1)
      }
    })

  // plugin uninstall
  command
    .command('uninstall')
    .description('Uninstall a plugin')
    .argument('<name>', 'Plugin name to uninstall')
    .option('--local', 'Uninstall from local instead of global')
    .action(async (name: string, options: { local?: boolean }) => {
      const { local = false } = options

      const packageMap: Record<string, string> = {
        ai: '@pleaseai/gh-please-ai',
        speckit: 'gh-please-plugin-speckit',
        linear: 'gh-please-plugin-linear',
        jira: 'gh-please-plugin-jira',
      }

      const packageName = packageMap[name] || name

      const result = await uninstallPlugin(packageName, { global: !local })

      if (result.success) {
        console.log(`✅ ${result.message}`)
      }
      else {
        console.error(`❌ ${result.message}`)
        if (result.error) {
          console.error(`   ${result.error}`)
        }
        process.exit(1)
      }
    })

  return command
}
