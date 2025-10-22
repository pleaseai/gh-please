# Available Plugins

This document lists officially supported and community plugins for `gh-please`.

## Official Plugins

### @pleaseai/gh-please-ai (Premium)

AI-powered code review and issue automation.

**Features:**
- 🤖 Automated code review with AI-generated comments
- 🔍 Issue triage and investigation
- 🛠️ Automated bug fixes
- 📝 PR review automation
- ⚙️ Configuration management (`.please/config.yml`)

**Commands:**
- `gh please ai triage <issue>` - Triage issues automatically
- `gh please ai investigate <issue>` - Deep bug investigation
- `gh please ai fix <issue>` - Automated fix implementation
- `gh please ai review <pr>` - AI code review
- `gh please ai apply <pr>` - Apply AI suggestions
- `gh please init` - Initialize PleaseAI configuration

**Installation:**

**Option 1: Premium Plugin (Recommended)**
```bash
# Prerequisites: GitHub CLI and authentication
gh auth login

# Install premium plugin
gh please plugin install ai --premium
```

For detailed setup instructions, see [Premium Plugin Installation Guide](./PREMIUM_PLUGIN_INSTALLATION.md).

**Requirements:**
- GitHub CLI (v2.0+) - Install from https://cli.github.com
- GitHub Authentication - Run: `gh auth login`
- Private Repository Access - Verify with: `gh repo view pleaseai/gh-please-ai`

**Option 2: Self-Hosted (npm)**
```bash
npm install -g @pleaseai/gh-please-ai
```

Note: Requires Node.js and npm. Not compatible with gh-please single binary distribution.

**Option 3: Git Submodule (Development)**
```bash
git submodule add git@github.com:pleaseai/gh-please-ai.git plugins/ai
git submodule update --init --recursive
```

For development or custom builds only.

**Repository:** Private (Premium)
**License:** UNLICENSED
**Author:** PleaseAI
**Version:** 0.1.0

**Configuration:**

The AI plugin uses `.please/config.yml` for comprehensive automation settings.

Quick setup:
```bash
gh please init  # Interactive configuration
gh please init --yes  # Use defaults
gh please init --force  # Reset configuration
```

**Key Settings:**
- Code review severity: `LOW | MEDIUM | HIGH`
- Max review comments: `number` (unlimited: `-1`)
- Issue workflow automation: triage, investigate, fix
- Organization-member-only restrictions
- Language preference: `ko | en`
- Ignore patterns: for files/directories to skip

📖 **Full Configuration Guide:** For detailed options, installation instructions, and examples, visit the [AI plugin repository](https://github.com/pleaseai/gh-please-ai) or see `plugins/ai/docs/CONFIGURATION.md` in development builds.

---

## Core Commands (Built-in)

The following commands are built into `gh-please` and don't require plugins:

### Issue Management

**Sub-Issues:**
- `gh please issue sub-issue create <parent> --title "..."` - Create sub-issue
- `gh please issue sub-issue add <parent> <child>` - Link existing issue
- `gh please issue sub-issue remove <parent> <child>` - Unlink sub-issue
- `gh please issue sub-issue list <parent>` - List all sub-issues

**Dependencies:**
- `gh please issue dependency add <issue> --blocked-by <blocker>` - Add blocker
- `gh please issue dependency remove <issue> <blocker>` - Remove blocker
- `gh please issue dependency list <issue>` - List blockers

### PR Management

- `gh please pr review-reply <comment-id> -b "text"` - Reply to review comment
- `gh please pr resolve <pr> --all` - Resolve all review threads
- `gh please pr resolve <pr> --thread <id>` - Resolve specific thread

### Plugin Management

- `gh please plugin list` - List installed plugins
- `gh please plugin search [name]` - Search for plugins
- `gh please plugin install <name>` - Install a plugin
- `gh please plugin uninstall <name>` - Uninstall a plugin

---

## Community Plugins

> No community plugins available yet. Be the first to create one!

See [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md) to create your own plugin.

---

## Plugin Development

Want to create your own plugin? Check out our comprehensive guide:

📖 [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)

**Quick Start:**

```typescript
import type { GhPleasePlugin } from '@pleaseai/gh-please/plugins'
import { Command } from 'commander'

const plugin: GhPleasePlugin = {
  name: 'myplugin',
  version: '1.0.0',
  type: 'command-group',

  registerCommands() {
    const cmd = new Command('myplugin')
      .description('My custom commands')

    cmd
      .command('hello')
      .action(() => console.log('Hello!'))

    return [cmd]
  }
}

export default plugin
```

---

## Requesting Features

Have an idea for a plugin? Let us know!

- 💡 [Request a Feature](https://github.com/pleaseai/gh-please/issues/new?template=feature_request.md)
- 🐛 [Report a Bug](https://github.com/pleaseai/gh-please/issues/new?template=bug_report.md)
- 💬 [Discussions](https://github.com/pleaseai/gh-please/discussions)

---

## Plugin Compatibility

| Plugin | Min gh-please Version | Status |
|--------|----------------------|--------|
| @pleaseai/gh-please-ai | 0.3.0 | ✅ Active |

---

## Contributing

We welcome community plugin submissions! To add your plugin to this list:

1. Ensure your plugin follows the [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
2. Submit a PR adding your plugin to the "Community Plugins" section
3. Include:
   - Plugin name and npm package
   - Description
   - Installation instructions
   - Command list
   - Repository link
   - License

**Template:**

```markdown
### @yourorg/gh-please-pluginname

Brief description of what your plugin does.

**Commands:**
- `gh please pluginname command` - Description

**Installation:**
````bash
npm install -g @yourorg/gh-please-pluginname
````

**Repository:** https://github.com/yourorg/gh-please-pluginname
**License:** MIT
**Author:** Your Name
````
