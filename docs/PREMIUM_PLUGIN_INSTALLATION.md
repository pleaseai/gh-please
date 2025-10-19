# Premium Plugin Installation Guide

This guide explains how to install premium plugins for `gh-please`, specifically the `@pleaseai/gh-please-ai` plugin.

## Overview

Premium plugins are distributed via private GitHub repositories and are installed directly to your system using the `gh please plugin install` command with the `--premium` flag.

**Key Benefits:**
- ✅ Easy one-command installation
- ✅ Automatic updates via GitHub releases
- ✅ Uses existing GitHub authentication
- ✅ Works with `gh-please` single binary distribution

## Prerequisites

### 1. GitHub CLI (gh)

Install the GitHub CLI if you haven't already:

**macOS (Homebrew)**
```bash
brew install gh
```

**Linux**
```bash
# Ubuntu/Debian
sudo apt install gh

# Fedora
sudo dnf install gh

# Arch
sudo pacman -S github-cli
```

**Windows**
```bash
choco install gh
```

See [GitHub CLI Installation](https://cli.github.com/) for more options.

### 2. GitHub Authentication

Authenticate with GitHub to access private repositories:

```bash
gh auth login
```

Follow the prompts to:
1. Select GitHub.com or GitHub Enterprise
2. Choose authentication method (HTTPS or SSH)
3. Authenticate your account

**Verify Authentication:**
```bash
gh auth status

# Output:
# Logged in to github.com as @username
# Git operations for github.com configured to use https protocol.
```

### 3. Private Repository Access

Ensure you have access to the private plugin repository:

```bash
gh repo view pleaseai/gh-please-ai

# Should show repository details if you have access
```

If you don't have access, request access from the PleaseAI team or check your subscription status at https://please.ai

## Installation

### Install Premium Plugin

```bash
gh please plugin install ai --premium
```

**What happens:**
1. Verifies GitHub authentication
2. Downloads latest release from `pleaseai/gh-please-ai`
3. Extracts plugin to `~/.gh-please/plugins/ai/`
4. Verifies plugin installation
5. Displays available commands

**Example Output:**
```
🔒 Installing premium plugin: ai
📡 Checking GitHub authentication...
✅ Authenticated as @username
📦 Downloading from pleaseai/gh-please-ai...
Downloading gh-please-ai-v0.1.0.tar.gz ━━━━━━━━━━━ 100% 2.3 MB
📂 Extracting to ~/.gh-please/plugins/ai...
✅ Plugin 'ai' installed successfully!

Available commands:
  gh please ai triage <issue>
  gh please ai investigate <issue>
  gh please ai fix <issue>
  gh please ai review <pr>
  gh please ai apply <pr>
  gh please init
```

### Verify Installation

```bash
gh please plugin list

# Output:
# 📦 Installed plugins:
#
# 🔒 ai v0.1.0 [command-group]
#    AI-powered code review and issue automation
#    by PleaseAI
```

### Initialize Configuration

```bash
gh please init

# Interactive setup for .please/config.yml
```

Or use defaults:

```bash
gh please init --yes
```

See [AI Plugin Configuration Guide](../plugins/ai/docs/CONFIGURATION.md) for detailed options.

## System Locations

### Plugin Installation Directory

Plugins are installed to:

```
~/.gh-please/plugins/
  ai/
    package.json
    dist/
      index.js
    README.md
    docs/
```

### Configuration File

The AI plugin configuration is stored at:

```
./.please/config.yml
```

(Repository root, checked into git)

## Troubleshooting

### "Not authenticated with GitHub"

**Error:**
```
❌ Not authenticated with GitHub
```

**Solution:**
```bash
gh auth login
gh please plugin install ai --premium
```

### "Repository not found or access denied"

**Error:**
```
❌ Failed to download plugin
   Error: repository not found or access denied
```

**Solutions:**
1. Verify you're authenticated as the correct user:
   ```bash
   gh auth status
   ```

2. Verify repository access:
   ```bash
   gh repo view pleaseai/gh-please-ai
   ```

3. If you don't have access:
   - Check your PleaseAI subscription at https://please.ai
   - Request access from the PleaseAI team
   - Contact support@please.ai

### "Plugin not found after installation"

**Error:**
```
❌ Plugin 'ai' not found
```

**Solution:**
```bash
# Verify installation directory
ls -la ~/.gh-please/plugins/ai/

# Reinstall plugin
gh please plugin install ai --premium --force
```

### Download Fails (Network Issues)

**Error:**
```
❌ Download failed
   Error: connection timeout
```

**Solutions:**
1. Check internet connection
2. Try again (automatic retry coming soon)
3. Check if GitHub is accessible:
   ```bash
   gh status
   ```

### Extract Fails (Disk Space)

**Error:**
```
❌ Failed to extract plugin
   Error: No space left on device
```

**Solution:**
Free up disk space and try again:

```bash
# Check available space
df -h

# Retry installation
gh please plugin install ai --premium
```

## Updating Premium Plugins

To update to the latest version:

```bash
gh please plugin install ai --premium --force
```

This will:
1. Download the latest release
2. Back up the current version (optional)
3. Install the new version
4. Verify the installation

## Uninstalling Premium Plugins

```bash
gh please plugin uninstall ai
```

This removes the plugin from `~/.gh-please/plugins/ai/`.

## GitHub Token Scopes

The premium plugin installation uses your existing GitHub CLI authentication. Ensure your GitHub token has these scopes:

- `repo` - For accessing private repositories
- `read:org` - For organization information (optional)

To check or update your token scopes:

```bash
gh auth refresh --scopes repo,read:org
```

## Security Considerations

### Token Storage

Your GitHub token is stored by GitHub CLI and is:
- ✅ Encrypted on disk
- ✅ Never logged or displayed
- ✅ Only used for authenticated API requests
- ✅ Limited to required scopes

See [GitHub CLI Authentication](https://cli.github.com/manual/gh_auth_login) for security details.

### Plugin Verification

Premium plugins are:
- ✅ Downloaded over HTTPS
- ✅ Signed by GitHub (certificate verification)
- ✅ Released by PleaseAI organization
- ✅ Stored locally in `~/.gh-please/plugins/`

## Support

For issues or questions about premium plugin installation:

1. **Check Documentation**: See `docs/` directory and plugin README
2. **Common Issues**: See [Troubleshooting](#troubleshooting) above
3. **Report Issues**: https://github.com/pleaseai/gh-please/issues
4. **Contact Support**: support@please.ai
5. **GitHub Discussions**: https://github.com/pleaseai/gh-please/discussions

## Related Documentation

- [Available Plugins](./AVAILABLE_PLUGINS.md)
- [AI Plugin Configuration](../plugins/ai/docs/CONFIGURATION.md)
- [GitHub CLI Manual](https://cli.github.com/manual)
- [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
