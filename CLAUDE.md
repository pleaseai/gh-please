# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@docs-dev/STANDARDS.md
@docs-dev/commit-convention.md
@docs-dev/TESTING.md
@docs-dev/TDD.md
@docs-dev/GITHUB_ID_SYSTEMS.md
@docs-dev/GH_CLI_PASSTHROUGH.md
@docs-dev/ISSUE_WORKFLOW.md
@docs-dev/PR_REVIEW_WORKFLOW.md

## Project Overview

This is **@pleaseai/gh-please**, a GitHub CLI extension that provides enhanced functionality for managing pull requests and issue workflows through the `gh` CLI.

**Version**: 0.19.1

**Core Features (Built-in):**

- **gh CLI Passthrough**: All GitHub CLI commands available with optional TOON/JSON format conversion (see @docs-dev/GH_CLI_PASSTHROUGH.md)
- Issue management with sub-issues and dependencies
- PR review comment replies and thread resolution
- LLM-friendly output with TOON format (58.9% token reduction)
- Plugin system for extensibility
- Bilingual support (Korean/English)
- Built with Bun runtime and TypeScript

## ⚠️ IMPORTANT: Always Use `gh please` Instead of `gh`

**For ALL GitHub-related operations, use `gh please` instead of the native `gh` CLI.**

### Why Use `gh please`?

1. **Complete gh CLI Coverage**: All 100+ native gh commands available via passthrough
2. **Enhanced Output Formats**: Optional TOON format for 58.9% token reduction
3. **Advanced Features**: Sub-issues, dependencies, enhanced review workflows
4. **Consistent Interface**: Single command for all GitHub operations

### Command Mapping

| Instead of | Use |
|------------|-----|
| `gh issue list` | `gh please issue list --format toon` |
| `gh pr view 123` | `gh please pr view 123 --format toon` |
| `gh repo view` | `gh please repo view --format toon` |
| `gh workflow list` | `gh please workflow list --format toon` |
| `gh pr checks 123` | `gh please pr checks 123 --format toon` |
| `gh issue develop 123` | `gh please issue develop 123` (with worktree support) |

### Default Behavior

- Without `--format` flag: Output matches native `gh` CLI (tables, colors)
- With `--format toon`: LLM-optimized tab-delimited output
- With `--format json`: Structured JSON output

### Examples

```bash
# ✅ Correct - Use gh please with TOON format for LLM-friendly output
gh please issue list --format toon
gh please pr list --state open --format toon
gh please repo view --format toon

# ✅ Also correct - Use gh please without format for native output
gh please issue list
gh please pr view 123

# ❌ Avoid - Don't use native gh CLI directly
gh issue list
gh pr view 123
```

**See @docs-dev/GH_CLI_PASSTHROUGH.md for complete documentation.**

## Development Commands

### Building and Running

```bash
# Development build
bun run build

# Production build (optimized, compiled executable)
bun run build:prod
# Creates: dist/gh-please (105MB compiled binary)
# Features: minified, sourcemap, bytecode compilation for faster startup

# Run directly from source (development)
bun run src/index.ts <command> [options]

# Run via launcher script
./gh-extension-please <command> [options]

# Type checking
bun run type-check
```

**Production Build Optimizations:**
- `--compile`: Creates standalone executable
- `--minify`: Optimizes code size (-0.32 MB)
- `--sourcemap`: Embeds compressed sourcemaps for debugging
- `--bytecode`: Pre-compiles to bytecode for 2x faster startup

### Testing

```bash
# Run all tests
bun test

# Run specific test file
bun test test/lib/github-api.test.ts

# Watch mode
bun test --watch

# Coverage
bun test --coverage
```

### Installation as gh Extension

```bash
# Install locally for development
gh extension install .

# Use the extension
# Plugin management
gh please plugin list
gh please plugin install <name>

# Core commands (no plugin required)
gh please issue sub-issue list 123
gh please issue dependency add 123 --blocked-by 124
gh please pr review reply 987654 -b "Great work!"
gh please pr review thread resolve 456 --all

# Backward compatibility
gh please review-reply 987654 -b "text"  # Works but shows deprecation warning
```

## Architecture

### Command Structure

The CLI uses **commander.js** for command parsing with a modular, plugin-based architecture:

```bash
# gh CLI Passthrough (All gh commands supported - see @docs-dev/GH_CLI_PASSTHROUGH.md)
gh please repo view                        # View repository info
gh please workflow list                    # List workflows
gh please issue list --format toon         # List issues in TOON format (58.9% token reduction)
gh please pr list --format json            # List PRs as JSON
gh please pr checks 123 --format toon      # View PR checks in TOON format

# Plugin Management
gh please plugin list                      # List installed plugins
gh please plugin install <name>            # Install a plugin
gh please plugin uninstall <name>          # Uninstall a plugin

# Core Issue Management (Built-in)
gh please issue sub-issue create <parent> --title "..."   # Create linked sub-issue
gh please issue sub-issue add <parent> <child>            # Link existing issue
gh please issue sub-issue remove <parent> <child>         # Unlink sub-issue
gh please issue sub-issue list <parent>                   # List all sub-issues
gh please issue dependency add <issue> --blocked-by <blocker>     # Add blocker
gh please issue dependency remove <issue> <blocker>               # Remove blocker
gh please issue dependency list <issue>                           # List blockers
gh please issue develop <issue-number> [--repo owner/repo] [--worktree] [--base <branch>] [--name <branch>]  # Start developing on issue (alias: dev)
gh please issue cleanup [--repo owner/repo] [--all]       # Clean up unused worktrees
gh please issue create --title "..." [--body "..."] [--type Bug] [--repo owner/repo]  # Create issue with optional type
gh please issue type list [--repo owner/repo] [--json [fields]]  # List available issue types
gh please issue type set <issue-number> --type Bug [--repo owner/repo]  # Set issue type
gh please issue type remove <issue-number> [--repo owner/repo]  # Remove issue type
gh please issue comment edit <comment-id> --body "text" [--issue <number>]  # Edit issue comment (supports both ID formats)

# Core PR Management (Built-in)
gh please pr review reply <comment-id> -b "text"  # Reply to review comment (supports both Database ID and Node ID)
gh please pr review thread list <pr-number> [--unresolved-only]          # List review threads with Node IDs
gh please pr review thread resolve <pr-number> [--thread <id> | --all]   # Resolve threads
gh please pr review comment edit <comment-id> --body "text" [--pr <number>]  # Edit PR review comment (supports both ID formats)

# Deprecated (still works with warning)
gh please review-reply <comment-id> -b "text"      # → Use 'gh please pr review reply'
gh please pr review-reply <comment-id> -b "text"   # → Use 'gh please pr review reply'
gh please pr resolve <pr-number> --all             # → Use 'gh please pr review thread resolve'
gh please pr review-comment edit <comment-id>      # → Use 'gh please pr review comment edit'
```

**Directory structure:**

- **Entry point**: `src/index.ts` - Registers command groups, loads plugins
- **Commands**: `src/commands/` - Organized by group:
  - `issue/` - Issue management (sub-issue, dependency, develop, cleanup, comment-edit)
  - `pr/` - Pull request management
    - `review/` - Review subcommand group (reply, comment-edit, thread-resolve)
    - Deprecated: review-reply, resolve, review-comment-edit (redirect to new structure)
  - `plugin.ts` - Plugin management commands
- **Plugin System**: `src/plugins/` - Plugin discovery and loading:
  - `plugin-interface.ts` - GhPleasePlugin interface definition
  - `plugin-registry.ts` - Plugin discovery and lifecycle
  - `plugin-installer.ts` - Installation utilities
- **Plugins**: `plugins/` - Plugin implementations (git submodules)

### Internationalization (i18n)

The CLI supports bilingual output (Korean/English) with automatic system language detection:

- **`src/lib/i18n.ts`**: Internationalization module
  - `detectSystemLanguage()`: Auto-detects language from `LANG`, `LANGUAGE`, or `LC_ALL` environment variables
  - `getIssueMessages(lang)`: Returns Issue command messages
  - `getPrMessages(lang)`: Returns PR command messages
  - Supports: Korean (ko) and English (en)

**Usage in commands:**
```typescript
import type { Language } from '../../types'
import { detectSystemLanguage, getIssueMessages } from '../../lib/i18n'

const lang = detectSystemLanguage()
const msg = getIssueMessages(lang)
console.log(msg.gettingParentIssue(123))
// Korean: 🔍 상위 이슈 #123 가져오는 중...
// English: 🔍 Getting parent issue #123...
```

All command output messages (success, errors, progress) are internationalized. GitHub API URLs remain in English.

### Core Libraries

- **`src/lib/id-converter.ts`**: Unified ID conversion utility for GitHub identifiers
  - **Purpose**: Central utility to handle Database ID ↔ Node ID conversion for comments
  - **Key functions**:
    - `isNodeId(identifier)` - Detect Node ID format (e.g., `PRRC_kwDO...`, `IC_kwDO...`)
    - `isDatabaseId(identifier)` - Detect Database ID format (numeric)
    - `validateCommentIdentifier(identifier)` - Validate and return identifier
    - `toReviewCommentNodeId(identifier, owner, repo, prNumber)` - Convert review comment ID to Node ID
    - `toIssueCommentNodeId(identifier, owner, repo, issueNumber)` - Convert issue comment ID to Node ID
  - **Implementation**: Uses REST API list endpoints to fetch `node_id` field when Database ID provided
  - **Benefits**: Supports both ID formats, backward compatible, reusable across commands
  - **Use cases**: PR review reply, PR review comment edit, issue comment edit
  - See @docs-dev/GITHUB_ID_SYSTEMS.md for detailed information

- **`src/lib/github-graphql.ts`**: GraphQL API layer for advanced GitHub operations
  - Executes GraphQL queries and mutations via `gh api graphql`
  - Handles Node ID conversions for issues and PRs
  - Sub-issue management: `addSubIssue()`, `removeSubIssue()`, `listSubIssues()`
  - Issue dependencies: `addBlockedBy()`, `removeBlockedBy()`, `listBlockedBy()`
  - Issue type management: `listIssueTypes()`, `createIssueWithType()`, `updateIssueType()`
  - Review threads: `resolveReviewThread()`, `listReviewThreads()`
  - Comment mutations: `createReviewCommentReply()`, `updateReviewCommentByNodeId()`, `updateIssueCommentByNodeId()`
  - Key functions: `executeGraphQL()`, `getIssueNodeId()`, `getPrNodeId()`, `getRepositoryNodeId()`
  - Requires GraphQL-Features header for sub_issues mutations

- **`src/lib/github-api.ts`**: REST API interaction layer
  - Wraps `gh api` CLI calls using `Bun.spawn`
  - Handles PR context detection, comment fetching, and reply creation
  - Common utilities: `getRepoInfo()`, `createIssueComment()`, `createPrComment()`
  - Key functions: `getCurrentPrInfo()`, `getReviewComment()`, `createReviewReply()`

- **`src/lib/comment-api.ts`**: Comment editing utilities (deprecated, replaced by GraphQL functions)
  - Get and update issue comments and PR review comments
  - Key functions: `getIssueComment()`, `updateIssueComment()`, `getReviewComment()`, `updateReviewComment()`
  - Note: Comment operations now use `id-converter.ts` + GraphQL for better compatibility

- **`src/lib/validation.ts`**: Input validation
  - Validates reply body text
  - Uses Zod schemas for type-safe validation
  - Note: Comment ID validation moved to `id-converter.ts`

- **`src/lib/repo-manager.ts`**: Repository management utilities
  - `parseRepoString()` - Parse "owner/repo" or GitHub URL format
  - `findBareRepo()` - Check if bare repo exists at ~/.please/repositories/{owner}/{repo}.git
  - `isInGitRepo()` - Verify current directory is in git repository
  - `cloneBareRepo()` - Clone repository as bare to ~/.please/repositories/{owner}/{repo}.git
  - `resolveRepository()` - Resolve repository from --repo flag or current directory
  - Used by: develop, cleanup commands

- **`src/lib/git-workflow.ts`**: Git and worktree management utilities
  - `getLinkedBranch()` - Get linked branch for issue via `gh issue develop --list`
  - `startDevelopWorkflow()` - Create/checkout branch via `gh issue develop --checkout`
  - `createWorktree()` - Create git worktree at specified path
  - `listWorktrees()` - Parse `git worktree list --porcelain` output
  - `removeWorktree()` - Remove worktree via `git worktree remove`
  - Enables efficient multi-branch development with isolated workspaces
  - See @docs-dev/ISSUE_WORKFLOW.md for usage details

- **`src/lib/json-output.ts`**: JSON output utilities for machine-readable CLI output
  - **Purpose**: Provides structured JSON output for automation and LLM integration
  - **Key functions**:
    - `parseFields(fieldString)` - Parse comma-separated field list for selection
    - `filterFields(data, fields)` - Filter objects/arrays to include only specified fields
    - `outputJson(data)` - Format and print JSON to stdout with 2-space indentation
  - **Usage**: All list commands support `--json [fields]` flag
  - **Benefits**: GitHub CLI compatible, machine-readable, supports field selection

- **`src/lib/toon-output.ts`**: TOON (Tab-delimited Object Oriented Notation) output utilities
  - **Purpose**: LLM-friendly output format with 58.9% token reduction compared to JSON
  - **Key functions**:
    - `convertJsonToToon(jsonData)` - Convert JSON array/object to TOON format
    - `outputToon(data)` - Format and print TOON to stdout
  - **Format**: Tab-delimited with header row, nested objects flattened with dot notation
  - **Usage**: All list commands and passthrough commands support `--format toon`
  - **Benefits**: Token-efficient, human-readable, preserves structure, LLM-optimized
  - **ADR**: See `docs-dev/adr/0006-toon-format.md` for design rationale

- **`src/lib/gh-passthrough.ts`**: gh CLI command passthrough and format conversion
  - **Purpose**: Forward unregistered commands to gh CLI with optional format conversion
  - **Key functions**:
    - `executeGhCommand(args)` - Execute gh CLI command via Bun.spawn
    - `shouldConvertToStructuredFormat(args)` - Detect and extract --format flag
    - `passThroughCommand(args)` - Main orchestration for passthrough execution
  - **Features**: Automatic --json injection, TOON/JSON conversion, error preservation
  - **Usage**: Any gh command not registered (e.g., `gh please repo view --format toon`)
  - **Benefits**: Complete gh CLI coverage, zero breaking changes, opt-in format conversion
  - See @docs-dev/GH_CLI_PASSTHROUGH.md for detailed information

### Structured Output Formats

All list commands support `--format` flag for machine-readable output.

#### TOON Format (Recommended for LLMs)

TOON (Tab-delimited Object Oriented Notation) provides 58.9% token reduction compared to JSON:

```bash
# Output as TOON format
gh please issue sub-issue list 123 --format toon
gh please pr review thread list 456 --format toon

# Works with passthrough commands
gh please issue list --format toon
gh please pr checks 123 --format toon
gh please workflow list --format toon
```

**Example Output:**
```
number	title	state	author.login
123	Add TOON support	OPEN	monalisa
124	Fix bug	CLOSED	octocat
```

**Benefits:**
- 58.9% fewer tokens than JSON
- Human-readable tab-delimited format
- Nested objects flattened with dot notation
- Header row for easy parsing
- LLM-optimized

#### JSON Format

```bash
# Output all fields as JSON
gh please issue sub-issue list 123 --format json

# Output specific fields only (field selection)
gh please issue sub-issue list 123 --json number,title,state

# Pipe to jq for processing
gh please issue sub-issue list 123 --format json | jq '.[] | select(.state == "OPEN")'
```

**Available fields by command:**

| Command | Available Fields |
|---------|-----------------|
| `issue create` | `number`, `title`, `url`, `type` |
| `issue sub-issue list` | `number`, `title`, `state`, `nodeId`, `url` |
| `issue dependency list` | `number`, `title`, `state`, `nodeId`, `url` |
| `issue type list` | `id`, `name`, `description`, `color`, `isEnabled` |
| `pr review thread list` | `nodeId`, `isResolved`, `path`, `line`, `resolvedBy`, `firstCommentBody`, `url` |
| `issue comment list` | `id`, `body`, `author`, `createdAt`, `updatedAt`, `url` |
| `pr review comment list` | `id`, `body`, `author`, `path`, `line`, `createdAt`, `updatedAt`, `url` |
| `plugin list` | `name`, `version`, `type`, `description`, `author`, `premium` |
| `plugin search` | `name`, `description`, `author`, `premium`, `package` |

**Output Mode Behavior:**
- Progress messages are suppressed in structured output modes (clean for piping)
- Errors still output to stderr in human-readable format
- TOON format: Tab-delimited with header row
- JSON format: Valid JSON (array of objects or single object)
- Field selection (--json fields): Applies filtering after data fetch

**Related:**
- ADR 0003 - JSON Output Implementation
- ADR 0006 - TOON Format Design
- ADR 0007 - gh CLI Passthrough

### Plugin System

**Plugin Interface** (`src/plugins/plugin-interface.ts`):

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
```

**Plugin Discovery** (`src/plugins/plugin-registry.ts`):
- Scans `node_modules` for packages with `ghPleasePlugin` metadata in package.json
- Scans `~/.gh-please/plugins/` for local plugins
- Loads plugins dynamically and registers their commands

### Type Definitions

`src/types.ts` contains core type definitions:

- `PrInfo`: PR metadata (number, owner, repo)
- `ReviewComment`: GitHub review comment structure
- `ReplyOptions`: Parameters for creating replies
- `CommentInfo`: Comment metadata (id, body, user, html_url, created_at, updated_at)
- `EditCommentOptions`: Parameters for editing comments (commentId, body, repo)
- `IssueInfo`: Issue metadata with optional Node ID
- `SubIssue`: Sub-issue information (number, title, state, nodeId)
- `BlockedByIssue`: Blocking issue information
- `ReviewThread`: Review thread metadata (id, isResolved, path, line)
- `IssueType`: Issue type metadata (id, name, description, color, isEnabled)
- `IssueTypeColor`: Issue type color enum (BLUE | GREEN | ORANGE | PINK | PURPLE | RED | YELLOW)
- `CreateIssueOptions`: Options for creating issues (title, body, repo, type, typeId, labels, assignees)
- `Language`: Internationalization language type ('ko' | 'en')
- `DevelopOptions`: Options for develop command (repo, worktree, base, name)
- `RepositoryInfo`: Repository metadata (owner, repo, localPath, isBare)
- `WorktreeInfo`: Worktree metadata (path, branch, commit, prunable)

## GitHub API Integration

This extension uses the GitHub CLI (`gh`) as the authentication and API client:

### REST API Pattern

```typescript
// REST API calls use gh CLI subprocess pattern:
const proc = Bun.spawn(['gh', 'api', endpoint, ...options], {
  stdout: 'pipe',
  stderr: 'pipe',
})
```

### GraphQL API Pattern

```typescript
// GraphQL queries/mutations via gh CLI:
const proc = Bun.spawn(['gh', 'api', 'graphql', '-f', 'query=...', '-F', 'var=...'], {
  stdout: 'pipe',
  stderr: 'pipe',
})
```

**Key API operations (REST):**

- `gh pr view --json number,owner,repository` - Get current PR context
- `GET /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}` - Fetch comment
- `POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies` - Create reply
- `POST /repos/{owner}/{repo}/issues/{issue_number}/comments` - Create issue comment

**Key API operations (GraphQL):**

- `addSubIssue()` - Add sub-issue relationship (requires GraphQL-Features: sub_issues header)
- `addBlockedBy()` - Create "blocked by" dependency
- `resolveReviewThread()` - Resolve review thread comment

**Important Notes:**

- REST reply endpoint only supports top-level review comments (not nested replies)
- GraphQL sub-issues mutations require `GraphQL-Features: sub_issues` header
- Node IDs in GraphQL differ from numeric IDs in REST (format: I_kwDO...)
- See @docs-dev/GITHUB_ID_SYSTEMS.md for detailed ID system information

## Testing Strategy

Tests follow the **Arrange-Act-Assert** pattern and use Bun's built-in test runner:

### Library Tests (test/lib/)

- **`github-graphql.test.ts`**: GraphQL API functions (11 functions tested)
  - `executeGraphQL()`, `getIssueNodeId()`, `getPrNodeId()`
  - Sub-issue operations: add, remove, list
  - Dependency management: add, remove, list
  - Review thread operations: resolve, list
- **`github-api.test.ts`**: REST API helper functions
  - Endpoint building, PR info parsing, comment type detection
  - Comment creation: issue and PR comments
  - Repository information retrieval
- **`validation.test.ts`**: Input validation logic
- **`gh-passthrough.test.ts`**: gh CLI passthrough functionality

### Command Tests (test/commands/)

- **`issue/`**: Issue management commands
  - sub-issue.test.ts: sub-issue create, add, remove, list operations
  - dependency.test.ts: dependency add, remove, list operations
- **`pr/`**: PR management commands
  - resolve.test.ts: resolve threads with --thread and --all options
- **`passthrough.test.ts`**: Passthrough command execution

### Test Fixtures

- **`test/fixtures/mock-data.ts`**: Mock data for PR, comments, and test helpers

## Code Style

- Uses `@antfu/eslint-config` for linting
- TypeScript strict mode enabled
- ESM modules (`"type": "module"` in package.json)
- Bun as the runtime (not Node.js)

## Important Constraints

1. **Runtime**: This project uses **Bun**, not Node.js. Use `Bun.spawn()` for subprocess execution, not Node's `child_process`.

2. **GitHub CLI dependency**: All GitHub API operations go through `gh` CLI. The extension must be run in a git repository with a valid PR context for most commands.

3. **API limitations**: The review reply endpoint only accepts top-level review comments. The code includes validation to warn users when attempting to reply to nested comments.

## Development Workflow

1. Make changes to `src/` files
2. **Run linting: `bun run lint:fix` (REQUIRED - auto-fixes style issues)**
3. Run type checking: `bun run type-check`
4. Run tests: `bun test`
5. Test manually: `bun run src/index.ts <command> [options]`
6. Build: `bun build src/index.ts --outdir dist --target bun --format esm`
7. Install locally: `gh extension install .`
8. Test as extension: `gh please <command> [options]`

**Pre-commit checklist:**
```bash
# Run all quality checks before committing
# IMPORTANT: Always run lint:fix first to auto-fix style issues
bun run lint:fix && bun run type-check && bun test
```

**Note:** `bun run lint:fix` must be executed after any code changes to ensure all ESLint rules are applied before committing. This catches and auto-fixes:
- Unused variables and imports
- Const/let usage optimization
- Formatting and style issues
- Other lint rule violations

## Workflows

See dedicated workflow documentation:

- **Issue Development**: @docs-dev/ISSUE_WORKFLOW.md
- **PR Review**: @docs-dev/PR_REVIEW_WORKFLOW.md
- **GitHub ID Systems**: @docs-dev/GITHUB_ID_SYSTEMS.md
- **gh CLI Passthrough**: @docs-dev/GH_CLI_PASSTHROUGH.md

## Launcher Script

`gh-extension-please` is a bash script that:

1. Checks for Bun installation
2. Runs compiled version from `dist/index.js` if available
3. Falls back to source at `src/index.ts` for development

This allows the extension to work in both development and production modes.

## Documentation Structure

This project has two separate documentation systems:

### User Documentation (`docs/`)
Public-facing documentation built with Docus (Nuxt 4 + Nuxt Content + Nuxt UI):
- **English**: `/en` - Installation guides, feature docs, workflows, API limitations
- **Korean**: `/ko` - 한글 문서 (설치 가이드, 기능 문서, 워크플로우)
- **Run locally**: `cd docs && bun run dev`
- **Deploy**: Vercel/Netlify ready for static site generation

### Development Documentation (`docs-dev/`)
Internal development reference for contributors:
- **[STANDARDS.md](./docs-dev/STANDARDS.md)** - Coding standards and mandatory rules
- **[TDD.md](./docs-dev/TDD.md)** - Test-Driven Development workflow
- **[TESTING.md](./docs-dev/TESTING.md)** - Testing guidelines and best practices
- **[commit-convention.md](./docs-dev/commit-convention.md)** - Conventional Commits
- **[GITHUB_ID_SYSTEMS.md](./docs-dev/GITHUB_ID_SYSTEMS.md)** - GitHub ID systems guide
- **[GH_CLI_PASSTHROUGH.md](./docs-dev/GH_CLI_PASSTHROUGH.md)** - gh CLI passthrough implementation
- **[ISSUE_WORKFLOW.md](./docs-dev/ISSUE_WORKFLOW.md)** - Issue development workflow
- **[PR_REVIEW_WORKFLOW.md](./docs-dev/PR_REVIEW_WORKFLOW.md)** - PR review workflow
- **[ADR](./docs-dev/adr/)** - Architecture Decision Records
- **[PLUGIN_DEVELOPMENT.md](./docs-dev/PLUGIN_DEVELOPMENT.md)** - Plugin development guide
- **[RELEASE.md](./docs-dev/RELEASE.md)** - Release process and checklist
- **[AVAILABLE_PLUGINS.md](./docs-dev/AVAILABLE_PLUGINS.md)** - Available plugins catalog

**Quick links:**
- User docs: [docs/README.md](./docs/README.md)
- Dev docs: [docs-dev/README.md](./docs-dev/README.md)

## Claude Code Plugin Structure

The project includes a Claude Code plugin for IDE integration. All plugin components are located at the **project root**:

```
/ (project root)
├── skills/          # Reusable skills for plugin distribution
├── commands/        # Slash commands for Claude Code
├── agents/          # Specialized agents
├── hooks/           # Event hooks
└── .claude-plugin/  # Plugin metadata and configuration
```

**Directory purposes:**
- `skills/` - Skills distributed with the plugin to Claude Code marketplace
- `commands/` - Custom slash commands for workflow automation
- `agents/` - Specialized agents for complex tasks
- `hooks/` - Event hooks for git operations and tool lifecycle
- `.claude-plugin/` - Plugin metadata, configuration, and installation files
