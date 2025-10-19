# Plugin Development Guide

This guide explains how to create plugins for `gh-please` to extend its functionality.

## Overview

The `gh-please` plugin system allows developers to add new commands and features without modifying the core codebase. Plugins are npm packages that implement the `GhPleasePlugin` interface and register commander.js commands.

## Plugin Architecture

### Plugin Interface

All plugins must implement the `GhPleasePlugin` interface:

```typescript
export interface GhPleasePlugin {
  name: string
  version: string
  type: PluginType
  registerCommands: () => Command[]
  init?: () => Promise<void>
  metadata?: PluginMetadata
}

export type PluginType = 'command-group' | 'provider' | 'utility'

export interface PluginMetadata {
  author: string
  description: string
  homepage?: string
  premium?: boolean
  license?: string
  keywords?: string[]
}
```

### Plugin Types

1. **command-group**: Adds a group of related commands (e.g., AI commands)
2. **provider**: Provides backend implementations or services (e.g., AI providers)
3. **utility**: Provides utility functions or enhancements

## Creating a Plugin

### 1. Project Setup

Create a new npm package:

```bash
mkdir gh-please-myplugin
cd gh-please-myplugin
npm init -y
```

### 2. Package Configuration

Add plugin metadata to `package.json`:

```json
{
  "name": "@your-org/gh-please-myplugin",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "ghPleasePlugin": {
    "name": "myplugin",
    "type": "command-group",
    "enabled": true
  },
  "peerDependencies": {
    "@pleaseai/gh-please": ">=0.3.0"
  },
  "dependencies": {
    "commander": "^12.1.0"
  }
}
```

### 3. Plugin Implementation

Create `src/index.ts`:

```typescript
import type { GhPleasePlugin } from '@pleaseai/gh-please/plugins'
import { Command } from 'commander'

const plugin: GhPleasePlugin = {
  name: 'myplugin',
  version: '1.0.0',
  type: 'command-group',

  metadata: {
    author: 'Your Name',
    description: 'My custom plugin for gh-please',
    homepage: 'https://github.com/yourorg/gh-please-myplugin',
    license: 'MIT',
    keywords: ['gh-please', 'plugin'],
  },

  registerCommands() {
    const cmd = new Command('myplugin')
      .description('My custom plugin commands')

    cmd
      .command('hello')
      .description('Say hello')
      .action(() => {
        console.log('Hello from my plugin!')
      })

    return [cmd]
  },

  async init() {
    // Optional: Plugin initialization
    // Check dependencies, validate config, etc.
  },
}

export default plugin
```

### 4. Command Structure

Commands should follow the `gh please <plugin-name> <command>` pattern:

```typescript
registerCommands() {
  const mainCmd = new Command('myplugin')
    .description('My plugin commands')

  // gh please myplugin hello
  mainCmd
    .command('hello <name>')
    .option('-l, --loud', 'Print in uppercase')
    .action((name: string, options: { loud?: boolean }) => {
      const message = `Hello, ${name}!`
      console.log(options.loud ? message.toUpperCase() : message)
    })

  // gh please myplugin status
  mainCmd
    .command('status')
    .description('Show plugin status')
    .action(() => {
      console.log('Plugin is active!')
    })

  return [mainCmd]
}
```

### 5. Build Configuration

Add TypeScript configuration `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "lib": ["ESNext"],
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
```

Build script in `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "prepublish": "npm run build"
  }
}
```

## Plugin Discovery

The plugin system discovers plugins in two ways:

### 1. NPM Packages

Plugins installed via npm are automatically discovered in `node_modules`:

```bash
npm install @your-org/gh-please-myplugin
```

The system scans `node_modules` for packages with `ghPleasePlugin` metadata.

### 2. Local Plugins

Plugins can also be placed in `~/.gh-please/plugins/`:

```bash
mkdir -p ~/.gh-please/plugins/myplugin
ln -s /path/to/your/plugin ~/.gh-please/plugins/myplugin
```

## Best Practices

### Error Handling

Always handle errors gracefully:

```typescript
.action(async (options) => {
  try {
    await performAction(options)
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
})
```

### Internationalization

Support multiple languages if possible:

```typescript
type Language = 'ko' | 'en'

const messages = {
  ko: { success: '성공!' },
  en: { success: 'Success!' }
}

function detectLanguage(): Language {
  const lang = process.env.LANG || ''
  return lang.startsWith('ko') ? 'ko' : 'en'
}
```

### GitHub API Integration

Use the `gh` CLI for GitHub API calls:

```typescript
async function callGitHubAPI(endpoint: string) {
  const proc = Bun.spawn(['gh', 'api', endpoint], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    throw new Error('GitHub API call failed')
  }

  return JSON.parse(output)
}
```

### Testing

Write tests for your plugin:

```typescript
import { describe, test, expect } from 'bun:test'
import plugin from './index'

describe('MyPlugin', () => {
  test('should register commands', () => {
    const commands = plugin.registerCommands()
    expect(commands).toHaveLength(1)
    expect(commands[0].name()).toBe('myplugin')
  })
})
```

## Publishing

### To NPM

```bash
npm publish
```

### To GitHub Packages

```bash
npm publish --registry=https://npm.pkg.github.com
```

## Example Plugins

### Simple Utility Plugin

```typescript
const plugin: GhPleasePlugin = {
  name: 'utils',
  version: '1.0.0',
  type: 'utility',

  registerCommands() {
    const cmd = new Command('utils')

    cmd
      .command('format <file>')
      .description('Format a file')
      .action((file: string) => {
        console.log(`Formatting ${file}...`)
      })

    return [cmd]
  },
}
```

### Integration Plugin

```typescript
const plugin: GhPleasePlugin = {
  name: 'jira',
  version: '1.0.0',
  type: 'integration',

  metadata: {
    author: 'Your Org',
    description: 'JIRA integration for gh-please',
  },

  async init() {
    // Check JIRA credentials
    const token = process.env.JIRA_TOKEN
    if (!token) {
      console.warn('Warning: JIRA_TOKEN not set')
    }
  },

  registerCommands() {
    const cmd = new Command('jira')

    cmd
      .command('link <issue>')
      .description('Link GitHub issue to JIRA')
      .action((issue: string) => {
        console.log(`Linking to JIRA: ${issue}`)
      })

    return [cmd]
  },
}
```

## Troubleshooting

### Plugin Not Loading

1. Check `package.json` has `ghPleasePlugin` metadata
2. Verify plugin exports default object implementing `GhPleasePlugin`
3. Check plugin is in `node_modules` or `~/.gh-please/plugins/`
4. Run `gh please plugin list` to see discovered plugins

### Command Not Appearing

1. Verify `registerCommands()` returns array of Command objects
2. Check command name doesn't conflict with existing commands
3. Ensure plugin `init()` doesn't throw errors

### Type Errors

1. Install peer dependencies: `npm install @pleaseai/gh-please commander`
2. Ensure TypeScript version >= 5.0
3. Check `tsconfig.json` has correct module settings

## Resources

- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Bun Documentation](https://bun.sh/docs)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Example Plugin: @pleaseai/gh-please-ai](https://github.com/pleaseai/gh-please-ai)

## Support

For plugin development help:
- Open an issue: https://github.com/pleaseai/gh-please/issues
- Check examples: https://github.com/pleaseai/gh-please/tree/main/plugins
