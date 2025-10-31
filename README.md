# @pleaseai/gh-please

[![npm version](https://badge.fury.io/js/@pleaseai%2Fgh-please.svg)](https://badge.fury.io/js/@pleaseai%2Fgh-please)
[![CI](https://github.com/pleaseai/gh-please/actions/workflows/ci.yml/badge.svg)](https://github.com/pleaseai/gh-please/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/pleaseai/gh-please/graph/badge.svg?token=BQKO959X1M)](https://codecov.io/github/pleaseai/gh-please)
[![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)

GitHub CLI extension - GitHub tools for LLMs

English | [한국어](./README.ko.md)

## Overview

`@pleaseai/gh-please` is a powerful GitHub CLI extension that enhances issue and PR management.

### Core Features (Built-in)
- **gh CLI Passthrough**: All GitHub CLI commands available through gh-please with optional TOON/JSON format
- **Issue Management**: Issue types, sub-issues, dependencies, and worktree-based development workflow
- **PR Management**: Review comment replies, thread resolution, comment editing
- **LLM-Friendly Output**: JSON, TOON (58.9% token reduction) format support across all commands
- **Multilingual**: Automatic Korean/English detection
- **Plugin System**: Extensible architecture

### Latest Updates (v0.18.0)
- 🚀 **gh CLI Passthrough** - Access all 100+ GitHub CLI commands through gh-please
- ✨ **TOON Format Support** - 58.9% token reduction for LLM-friendly output across all list commands
- ✨ **Automatic Format Conversion** - Convert any gh command output to TOON or JSON format
- ✨ **ID Converter Utility** - Support both Database ID and Node ID for comment operations
- ✨ **PR Review Thread List** - Display review threads with Node IDs and copy-ready resolve commands
- ✨ **E2E Testing** - Comprehensive end-to-end test coverage (26 tests, 100% pass rate)
- ✨ **Comment Management** - List and edit Issue/PR comments with flexible ID formats

## Quick Start

### Installation

```bash
gh extension install pleaseai/gh-please
```

### Get Started in 5 Minutes

```bash
# Issue management
gh please issue create --title "Fix bug" --type Bug
gh please issue sub-issue create 100 --title "Sub-task"
gh please issue dependency add 200 --blocked-by 199
gh please issue develop 123  # Auto-create worktree

# Issue types
gh please issue type list
gh please issue type set 123 --type Feature
gh please issue type remove 123

# PR management
gh please pr review reply 1234567890 -b "Fixed!"        # Database ID
gh please pr review reply PRRC_kwDOABC123 -b "Fixed!"    # Node ID also supported
gh please pr review thread list 456              # List threads with Node IDs
gh please pr review thread list 456 --unresolved-only
gh please pr review thread resolve 456 --all

# Comment management
gh please issue comment list 123 --format json
gh please issue comment edit 987654321 --body "Updated"  # Requires --issue option
gh please pr review comment edit 987654321 --body "Updated" --pr 456
```

## Key Features

### 🔄 gh CLI Passthrough

gh-please automatically supports **all** GitHub CLI commands through passthrough:

```bash
# Any gh command works through gh-please
gh please repo view
gh please workflow list
gh please release view v1.0.0

# Convert output to TOON format (58.9% token reduction)
gh please issue list --format toon
gh please issue view 123 --format toon      # View commands supported!
gh please pr view 456 --format toon
gh please pr checks 123 --format toon
gh please workflow list --format toon
gh please repo view --format toon

# Get JSON for automation
gh please pr list --format json
gh please issue view 123 --format json      # Auto-injects required fields
gh please repo view --format json
```

**How it works:**
- Unregistered commands automatically forward to gh CLI
- `--format toon` converts JSON output to TOON format (58.9% token savings)
- `--format json` preserves JSON output
- No format flag → preserve gh CLI's original table output
- Works with all gh commands that support `--json` flag
- **View commands**: Auto-injects required fields (e.g., `issue view`, `pr view`, `repo view`)

**Benefits:**
- ✅ **Complete gh CLI coverage** - Access all 100+ gh commands
- ✅ **LLM-friendly** - TOON format optimized for AI/automation
- ✅ **Automatic field injection** - View commands work seamlessly
- ✅ **Automatic updates** - New gh CLI features work immediately
- ✅ **Zero learning curve** - Use familiar gh commands

[Passthrough Documentation →](docs/en/features/gh-cli-passthrough.md)

### Issue Development Workflow

```bash
# Create isolated workspace for issue
gh please issue develop 123
# → Creates ~/.please/worktrees/repo/feat-123-feature

# Cleanup after work
gh please issue cleanup
```

[Detailed Workflow Guide →](docs/content/4.workflows/1.issue-workflow.md)

### Issue Type Management

```bash
# Create issue with type
gh please issue create --title "Login bug" --type Bug

# List available issue types
gh please issue type list
gh please issue type list --json name,color

# Set/update issue type
gh please issue type set 123 --type Feature

# Remove issue type
gh please issue type remove 123
```

### Sub-Issue Management

```bash
# Hierarchical issue structure
gh please issue sub-issue create 100 --title "Task 1"
gh please issue sub-issue list 100 --format markdown
```

### PR Review Workflow

```bash
# Respond to feedback (supports both Database ID and Node ID)
gh please pr review reply 1234567890 -b "Fixed in commit abc123"  # Database ID
gh please pr review reply PRRC_kwDOABC123 -b "Fixed!"            # Node ID

# Edit comments with flexible ID support
gh please pr review comment edit 1234567890 --body "Updated" --pr 456
gh please issue comment edit 987654321 --body "Updated" --issue 123

# Resolve all threads
gh please pr review thread resolve 456 --all
```

[PR Review Guide →](docs/content/4.workflows/2.pr-review-workflow.md)

### LLM-Friendly Output

```bash
# Human-readable format (default)
gh please issue sub-issue list 123

# TOON format for LLM processing (58.9% token reduction)
gh please issue sub-issue list 123 --format toon
gh please pr review thread list 456 --format toon

# JSON for scripts and automation
gh please issue sub-issue list 123 --format json
gh please pr list --state open --format json

# Works with passthrough commands too
gh please workflow list --format toon
gh please repo view --format json
```

## 📚 Documentation

### Getting Started
- [Installation Guide](docs/content/1.guide/1.getting-started.md)
- [5-Minute Quick Start](docs/content/1.guide/2.quick-start.md)

### Feature Guides
- [gh CLI Passthrough](docs/en/features/gh-cli-passthrough.md) - Access all GitHub CLI commands with TOON/JSON format
- [Issue Management](docs/content/2.features/1.issue-management.md) - Sub-issues, dependencies, development workflow
- [PR Management](docs/content/2.features/2.pr-management.md) - Review replies, thread resolution
- [LLM-Friendly Output](docs/content/2.features/3.output-formats.md) - JSON, TOON format for automation
- [Plugin System](docs/content/2.features/4.plugin-system.md) - Extension capabilities

### Workflows
- [Issue Development Workflow](docs/content/4.workflows/1.issue-workflow.md)
- [PR Review Workflow](docs/content/4.workflows/2.pr-review-workflow.md)

### Advanced Topics
- [Internationalization (i18n)](docs/content/5.advanced/1.i18n.md)
- [API Limitations](docs/content/5.advanced/2.api-limitations.md)

## Common Options

All commands support the `--repo` option:

```bash
# Current directory (default)
gh please issue sub-issue list 123

# Specify different repository
gh please issue sub-issue list 123 --repo owner/repo
gh please pr review reply <id> -b "text" -R owner/repo
```

## Claude Code Integration

Claude Code plugin enables AI to automatically suggest appropriate commands.

### Installation

```bash
# Internal marketplace
claude plugin install pleaseai-github

# Local development
ln -s $(pwd)/.claude-plugin ~/.claude/plugins/pleaseai-github
```

### Usage Examples

```
User: "Create a sub-issue for issue #123"
Claude: gh please issue sub-issue create 123 --title "..."

User: "Reply to PR review comment"
Claude: gh please pr review reply <comment-id> --body "..."
```

See [.claude-plugin/README.md](./.claude-plugin/README.md) for details.

## Plugin System

Modular plugin architecture since v0.3.0.

```bash
# Plugin management
gh please plugin list
gh please plugin install <name>
gh please plugin uninstall <name>
```

**Available Plugins:**
- **@pleaseai/gh-please-ai** (Premium) - AI-powered code review and issue automation

[Plugin Guide →](docs/content/2.features/4.plugin-system.md) | [Plugin Development →](./docs/PLUGIN_DEVELOPMENT.md)

## Development

### Prerequisites

- [GitHub CLI (`gh`)](https://cli.github.com/) - Version 2.0 or higher
- [Bun](https://bun.sh) - JavaScript runtime

### Development Installation

```bash
git clone https://github.com/pleaseai/gh-please.git
cd gh-please
bun install
gh extension install .
```

### Development Commands

```bash
# Build
bun run build

# Production build (optimized executable)
bun run build:prod

# Type checking
bun run type-check

# Lint (auto-fix)
bun run lint:fix

# Test
bun test
bun run test:unit         # Unit tests only
bun run test:integration  # Integration tests
bun run test:e2e          # End-to-end tests (requires GITHUB_TOKEN)
bun run test:coverage     # With coverage
```

### Quality Checks

Required before commit:

```bash
bun run lint:fix && bun run type-check && bun test
```

## 📚 Documentation

### User Documentation
- **[docs/](./docs/)** - Docus-based documentation site (English + Korean)
  - `/en` - English documentation
  - `/ko` - Korean documentation
  - Run locally: `cd docs && bun run dev`

### Development Documentation
- **[docs-dev/](./docs-dev/)** - Internal development documentation
  - [Development Standards](./docs-dev/STANDARDS.md) - Coding rules and requirements
  - [Commit Convention](./docs-dev/commit-convention.md) - Conventional Commits
  - [Testing Guide](./docs-dev/TESTING.md) - Testing best practices
  - [TDD Workflow](./docs-dev/TDD.md) - Red-Green-Refactor
  - [ADR](./docs-dev/adr/) - Architecture Decision Records
  - [Plugin Development](./docs-dev/PLUGIN_DEVELOPMENT.md) - Plugin development guide
  - [Release Process](./docs-dev/RELEASE.md) - Release procedures

## Contributing

Contributions are welcome! Please refer to the development documentation:

## License

MIT
