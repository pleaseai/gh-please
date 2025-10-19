# Migration Guide: v0.2.x → v0.3.0

This guide helps you migrate from `gh-please` v0.2.x to v0.3.0, which introduces a plugin-based architecture.

## What Changed in v0.3.0

### Major Changes

1. **Plugin System Introduced**: New modular architecture for extensibility
2. **AI Commands Moved to Plugin**: All AI features now require the `@pleaseai/gh-please-ai` plugin
3. **Removed from Core**:
   - `gh please ai` commands (triage, investigate, fix, review, apply)
   - `gh please init` command
   - AI configuration system
4. **New Plugin Commands**:
   - `gh please plugin list` - List installed plugins
   - `gh please plugin install` - Install plugins
   - `gh please plugin uninstall` - Remove plugins

### Commands That Moved

| v0.2.x Command | v0.3.0 Location | Status |
|----------------|-----------------|--------|
| `gh please init` | AI Plugin | Requires plugin |
| `gh please ai triage` | AI Plugin | Requires plugin |
| `gh please ai investigate` | AI Plugin | Requires plugin |
| `gh please ai fix` | AI Plugin | Requires plugin |
| `gh please ai review` | AI Plugin | Requires plugin |
| `gh please ai apply` | AI Plugin | Requires plugin |
| `gh please review-reply` | Core (deprecated) | Use `gh please pr review-reply` |
| `gh please pr review-reply` | Core | ✅ Built-in |
| `gh please pr resolve` | Core | ✅ Built-in |
| `gh please issue sub-issue` | Core | ✅ Built-in |
| `gh please issue dependency` | Core | ✅ Built-in |

### Commands That Stay in Core

These commands are still built-in and work without plugins:

- ✅ Issue management (`gh please issue sub-issue`, `gh please issue dependency`)
- ✅ PR management (`gh please pr review-reply`, `gh please pr resolve`)
- ✅ Plugin management (`gh please plugin list/install/uninstall`)

## Migration Steps

### Step 1: Update gh-please

```bash
gh extension upgrade pleaseai/gh-please
```

Verify the version:

```bash
gh please --version
# Should show: 0.3.0
```

### Step 2: Install AI Plugin (If Needed)

If you were using AI commands in v0.2.x, install the AI plugin:

**Option A: Premium Cloud Service (Recommended)**
```bash
gh please plugin install ai --premium
```

**Option B: Self-Hosted**
```bash
npm install -g @pleaseai/gh-please-ai
```

**Option C: Git Submodule (Development)**
```bash
# In your gh-please repository
git submodule add git@github.com:pleaseai/gh-please-ai.git plugins/ai
git submodule update --init --recursive
```

### Step 3: Verify Installation

Check that the plugin is loaded:

```bash
gh please plugin list
```

You should see:

```
📦 Installed Plugins:
  ai (0.1.0) - AI-powered code review and issue automation
```

### Step 4: Migrate Configuration

If you have `.please/config.yml`, it will continue to work with the AI plugin.

**No changes needed** - the AI plugin reads the same configuration format.

### Step 5: Update Scripts/CI

If you have automation scripts or CI workflows using AI commands, no changes needed:

```bash
# These still work the same way
gh please ai triage 123
gh please ai review 456
gh please init
```

The only requirement is having the AI plugin installed.

### Step 6: Update Documentation References

If you have internal docs referencing `gh please` commands:

- AI commands now require the plugin
- `gh please review-reply` → `gh please pr review-reply`
- Plugin installation is a prerequisite for AI features

## Breaking Changes

### 1. AI Commands Require Plugin

**Before (v0.2.x):**
```bash
gh extension install pleaseai/gh-please
gh please ai triage 123  # ✅ Works
```

**After (v0.3.0):**
```bash
gh extension install pleaseai/gh-please
gh please ai triage 123  # ❌ Error: AI plugin not found

# Need to install plugin first
gh please plugin install ai
gh please ai triage 123  # ✅ Works
```

### 2. Init Command Moved

**Before (v0.2.x):**
```bash
gh please init  # ✅ Built-in
```

**After (v0.3.0):**
```bash
gh please init  # ❌ Error: Command not found

# Requires AI plugin
gh please plugin install ai
gh please init  # ✅ Works
```

### 3. review-reply Command Deprecated

The top-level `review-reply` is deprecated in favor of the grouped command:

**Before (v0.2.x):**
```bash
gh please review-reply 123 -b "text"  # ✅ Works
```

**After (v0.3.0):**
```bash
gh please review-reply 123 -b "text"  # ⚠️ Deprecated warning
gh please pr review-reply 123 -b "text"  # ✅ Recommended
```

Both work in v0.3.0, but the old form shows a deprecation warning.

## Common Migration Issues

### Issue: "Command not found: ai"

**Problem:** AI plugin not installed

**Solution:**
```bash
gh please plugin install ai
```

### Issue: "Command not found: init"

**Problem:** Init command requires AI plugin

**Solution:**
```bash
gh please plugin install ai
gh please init
```

### Issue: ".please/config.yml not found"

**Problem:** Configuration file missing after migration

**Solution:**

Your old config file should still be there. If it's missing, reinitialize:

```bash
gh please init  # Interactive setup
# or
gh please init --yes  # Use defaults
```

### Issue: Plugin not loading

**Problem:** Plugin installed but not recognized

**Solution:**

1. Check plugin is installed:
   ```bash
   npm list -g | grep gh-please
   ```

2. Verify plugin metadata:
   ```bash
   cat ~/.gh-please/plugins/ai/package.json | grep ghPleasePlugin
   ```

3. Reinstall if needed:
   ```bash
   npm uninstall -g @pleaseai/gh-please-ai
   gh please plugin install ai
   ```

## Rollback (If Needed)

If you need to rollback to v0.2.x:

```bash
# Uninstall current version
gh extension remove pleaseai/gh-please

# Install specific version (if tagged)
gh extension install pleaseai/gh-please@v0.2.0
```

**Note:** v0.2.x tags may not exist. Contact support if you need to rollback.

## Testing Your Migration

Run these commands to verify everything works:

```bash
# Check version
gh please --version

# List plugins
gh please plugin list

# Test core commands (should work without plugins)
gh please issue sub-issue list 100 2>/dev/null || echo "Core commands: ✅"

# Test AI commands (requires plugin)
gh please ai triage 123 --help 2>/dev/null && echo "AI plugin: ✅" || echo "AI plugin: ❌ Not installed"

# Test init command (requires plugin)
gh please init --help 2>/dev/null && echo "Init command: ✅" || echo "Init command: ❌ Plugin required"
```

## History Note

Prior to v0.3.0, AI commands were included in the main codebase. These have been moved to a separate plugin to support the open-source model while keeping premium AI features private.

**What was in git history:**
- AI command implementations were simple GitHub comment triggers
- Actual AI processing happens server-side
- The triggers just post `/please-triage`, `/please-review`, etc. comments

This means the git history doesn't contain proprietary AI logic, only the trigger mechanism.

## Benefits of v0.3.0

### For All Users

- ✅ Smaller core package (faster installation)
- ✅ Modular architecture (install only what you need)
- ✅ Community plugin support
- ✅ Better separation of concerns

### For Premium Users

- ✅ Same AI features as before
- ✅ Private premium features via plugin
- ✅ Independent plugin updates
- ✅ More flexible deployment options

### For Open-Source Contributors

- ✅ Cleaner codebase
- ✅ Plugin development opportunities
- ✅ Easier to understand and contribute
- ✅ Standard plugin interface

## Need Help?

- 📖 [Plugin Development Guide](./PLUGIN_DEVELOPMENT.md)
- 📦 [Available Plugins](./AVAILABLE_PLUGINS.md)
- 🐛 [Report Migration Issues](https://github.com/pleaseai/gh-please/issues/new)
- 💬 [Ask Questions](https://github.com/pleaseai/gh-please/discussions)

## Appendix: Version Comparison

### Package Size

| Version | Size | Plugin Required |
|---------|------|----------------|
| v0.2.0 | ~150KB | No |
| v0.3.0 (core) | ~100KB | For AI features |
| v0.3.0 (with AI plugin) | ~180KB | - |

### Feature Matrix

| Feature | v0.2.x | v0.3.0 Core | v0.3.0 + AI Plugin |
|---------|--------|-------------|-------------------|
| Issue Management | ✅ | ✅ | ✅ |
| PR Management | ✅ | ✅ | ✅ |
| AI Commands | ✅ | ❌ | ✅ |
| Init Command | ✅ | ❌ | ✅ |
| Plugin System | ❌ | ✅ | ✅ |
| Community Plugins | ❌ | ✅ | ✅ |

### Command Count

| Version | Commands | Notes |
|---------|----------|-------|
| v0.2.0 | 15 | All built-in |
| v0.3.0 (core) | 8 | Core utilities |
| v0.3.0 (+ AI plugin) | 15 | Full feature set |
