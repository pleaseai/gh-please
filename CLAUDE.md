# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@docs/STANDARDS.md
@docs/commit-convention.md
@docs/TESTING.md
@docs/TDD.md

## Project Overview

This is **@pleaseai/gh-please**, a GitHub CLI extension that provides enhanced functionality for managing pull requests and issue workflows through the `gh` CLI.

**Version**: 0.3.0

**Core Features (Built-in):**

- Issue management with sub-issues and dependencies
- PR review comment replies and thread resolution
- Plugin system for extensibility
- Bilingual support (Korean/English)
- Built with Bun runtime and TypeScript

**AI Features (Plugin Required - `@pleaseai/gh-please-ai`):**

- Initialize PleaseAI configuration (`.please/config.yml`)
- AI-powered code review and issue automation
- Issue triage → investigate → fix workflow
- Code review automation (severity thresholds, auto-review, draft PR handling)

**v0.3.0 Changes:**

- Introduced plugin architecture for modularity
- Moved AI features to separate private plugin
- Core utilities remain open-source
- Plugin discovery and management system

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
gh please plugin install ai

# Core commands (no plugin required)
gh please issue sub-issue list 123
gh please issue dependency add 123 --blocked-by 124
gh please pr review-reply 987654 -b "Great work!"
gh please pr resolve 456 --all

# AI commands (requires AI plugin)
gh please ai triage 123
gh please ai review 456
gh please init

# Backward compatibility
gh please review-reply 987654 -b "text"  # Works but shows deprecation warning
```

## Architecture

### Command Structure (v0.3.0)

The CLI uses **commander.js** for command parsing with a modular, plugin-based architecture:

```bash
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

# Core PR Management (Built-in)
gh please pr review-reply <comment-id> -b "text"  # Reply to review comment
gh please pr resolve <pr-number> [--thread <id> | --all]   # Resolve threads

# AI Commands (Requires @pleaseai/gh-please-ai plugin)
gh please ai triage <issue-number>         # Trigger triage bot
gh please ai investigate <issue-number>    # Trigger investigation
gh please ai fix <issue-number>            # Trigger fix workflow
gh please ai review <pr-number>            # Trigger PR review
gh please ai apply <pr-number>             # Apply bot suggestions
gh please init                             # Initialize .please/config.yml

# Deprecated (still works with warning)
gh please review-reply <comment-id> -b "text"   # → Use 'gh please pr review-reply'
```

**Directory structure:**

- **Entry point**: `src/index.ts` - Registers command groups, loads plugins
- **Commands**: `src/commands/` - Organized by group:
  - `issue/` - Issue management (sub-issue, dependency, develop, cleanup)
  - `pr/` - Pull request management (review-reply, resolve)
  - `plugin.ts` - Plugin management commands
- **Plugin System**: `src/plugins/` - Plugin discovery and loading:
  - `plugin-interface.ts` - GhPleasePlugin interface definition
  - `plugin-registry.ts` - Plugin discovery and lifecycle
  - `plugin-installer.ts` - Installation utilities
- **Plugins**: `plugins/` - Plugin implementations (git submodules):
  - `ai/` - AI plugin (private, git submodule)

### Internationalization (i18n)

The CLI supports bilingual output (Korean/English) with automatic system language detection:

- **`src/lib/i18n.ts`**: Internationalization module
  - `detectSystemLanguage()`: Auto-detects language from `LANG`, `LANGUAGE`, or `LC_ALL` environment variables
  - `getIssueMessages(lang)`: Returns Issue command messages
  - `getPrMessages(lang)`: Returns PR command messages
  - Supports: Korean (ko) and English (en)
  - **Note**: AI-related messages (init, AI commands) moved to AI plugin

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

- **`src/lib/github-graphql.ts`**: GraphQL API layer for advanced GitHub operations
  - Executes GraphQL queries and mutations via `gh api graphql`
  - Handles Node ID conversions for issues and PRs
  - Sub-issue management: `addSubIssue()`, `removeSubIssue()`, `listSubIssues()`
  - Issue dependencies: `addBlockedBy()`, `removeBlockedBy()`, `listBlockedBy()`
  - Review threads: `resolveReviewThread()`, `listReviewThreads()`
  - Key functions: `executeGraphQL()`, `getIssueNodeId()`, `getPrNodeId()`
  - Requires GraphQL-Features header for sub_issues mutations

- **`src/lib/github-api.ts`**: REST API interaction layer
  - Wraps `gh api` CLI calls using `Bun.spawn`
  - Handles PR context detection, comment fetching, and reply creation
  - Common utilities: `getRepoInfo()`, `createIssueComment()`, `createPrComment()`
  - Key functions: `getCurrentPrInfo()`, `getReviewComment()`, `createReviewReply()`

- **`src/lib/validation.ts`**: Input validation
  - Validates comment IDs and reply body text
  - Uses Zod schemas for type-safe validation

- **`src/lib/repo-manager.ts`**: Repository management utilities
  - `parseRepoString()` - Parse "owner/repo" or GitHub URL format
  - `findBareRepo()` - Check if bare repo exists at ~/repos/{owner}/{repo}.git
  - `isInGitRepo()` - Verify current directory is in git repository
  - `cloneBareRepo()` - Clone repository as bare to ~/repos/{owner}/{repo}.git
  - `resolveRepository()` - Resolve repository from --repo flag or current directory
  - Used by: develop, cleanup commands

- **`src/lib/git-workflow.ts`**: Git and worktree management utilities
  - `getLinkedBranch()` - Get linked branch for issue via `gh issue develop --list`
  - `startDevelopWorkflow()` - Create/checkout branch via `gh issue develop --checkout`
  - `createWorktree()` - Create git worktree at specified path
  - `listWorktrees()` - Parse `git worktree list --porcelain` output
  - `removeWorktree()` - Remove worktree via `git worktree remove`
  - Enables efficient multi-branch development with isolated workspaces

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

**AI Plugin** (Private):
- Location: `plugins/ai/` (git submodule)
- Repository: `git@github.com:pleaseai/gh-please-ai.git`
- Contains: AI commands, init command, config schemas, please-trigger utility
- All AI functionality moved from core in v0.3.0

### Type Definitions

`src/types.ts` contains core type definitions:

- `PrInfo`: PR metadata (number, owner, repo)
- `ReviewComment`: GitHub review comment structure
- `ReplyOptions`: Parameters for creating replies
- `IssueInfo`: Issue metadata with optional Node ID
- `SubIssue`: Sub-issue information (number, title, state, nodeId)
- `BlockedByIssue`: Blocking issue information
- `ReviewThread`: Review thread metadata (id, isResolved, path, line)
- `PleaseTriggerType`: Union type for automation triggers (triage | investigate | fix | review | apply) - **Note**: Moved to AI plugin
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
- **`please-trigger.test.ts`**: PleaseAI automation triggers
  - Trigger comment building for all automation types
- **`validation.test.ts`**: Input validation logic

### Command Tests (test/commands/)

- **`ai/`**: AI trigger commands (5 commands)
  - triage.test.ts, investigate.test.ts, fix.test.ts, review.test.ts, apply.test.ts
- **`issue/`**: Issue management commands
  - sub-issue.test.ts: sub-issue create, add, remove, list operations
  - dependency.test.ts: dependency add, remove, list operations
- **`pr/`**: PR management commands
  - resolve.test.ts: resolve threads with --thread and --all options
- **`init.test.ts`**: Configuration initialization

### Test Fixtures

- **`test/fixtures/mock-data.ts`**: Mock data for PR, comments, and test helpers

**Coverage**: 87 total test cases with 135 assertions across 13 test files (100% pass rate)

## Code Style

- Uses `@antfu/eslint-config` for linting
- TypeScript strict mode enabled
- ESM modules (`"type": "module"` in package.json)
- Bun as the runtime (not Node.js)

## Important Constraints

1. **Runtime**: This project uses **Bun**, not Node.js. Use `Bun.spawn()` for subprocess execution, not Node's `child_process`.

2. **GitHub CLI dependency**: All GitHub API operations go through `gh` CLI. The extension must be run in a git repository with a valid PR context for most commands.

3. **API limitations**: The review reply endpoint only accepts top-level review comments. The code includes validation to warn users when attempting to reply to nested comments.

4. **Configuration location**: The `init` command creates `.please/config.yml` in the repository root, not in a user home directory.

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

## Issue Workflow

Follow this standardized workflow for all feature development and bug fixes:

### 1. Create Issue Branch

Create a new branch linked to a GitHub issue using the gh CLI:

```bash
gh issue develop <issue-number>
```

This command:

- Creates a branch automatically named after the issue (e.g., `issue-<number>`)
- Links the branch to the issue in GitHub
- Helps track work in progress

### 2. Checkout Branch

Switch to the newly created branch:

```bash
git checkout <branch-name>
# or if using gh workflow:
gh issue develop <issue-number>  # automatically checks out
```

### 3. Follow TDD Cycle

Implement changes following Test-Driven Development (see `docs/TDD.md`):

1. **Red**: Write a failing test that defines the desired behavior
2. **Green**: Implement the minimum code needed to make the test pass
3. **Refactor**: Improve code structure while keeping tests passing
4. **Commit**: Use small, focused commits following conventional commits (see `docs/commit-convention.md`)

Key commands:

```bash
# Run tests continuously
bun test --watch

# Run all tests before committing
bun test

# Type check before committing
bun run type-check
```

### 4. Commit, Push, and Create PR

Once your implementation is complete and all tests pass:

```bash
# Stage your changes
git add .

# Create a commit following conventional commit format
git commit -m "feat: brief description of the feature"

# Push to remote
git push -u origin <branch-name>

# Create a pull request
gh pr create --title "Title" --body "Description"
```

Or use the convenient shorthand:

```bash
/commit-commands:commit-push-pr
```

### Workflow Summary

```
┌─────────────────────────────────────┐
│ 1. Create issue branch              │
│    gh issue develop <issue-number>  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Checkout branch                  │
│    git checkout <branch-name>       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Follow TDD cycle                 │
│    Red → Green → Refactor → Commit  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Commit, Push, and Create PR      │
│    git commit → git push → gh pr    │
└─────────────────────────────────────┘
```

## PR Review Workflow

After code review feedback is received on a PR, follow this workflow to respond to comments and manage threads:

### 1. Identify Review Comments

Get all review comments on a PR to understand feedback:

```bash
# View PR with review comments
gh pr view <pr-number>

# Get detailed comment information
gh api repos/{owner}/{repo}/pulls/<pr-number>/comments
```

### 2. Apply Code Review Feedback

Address all findings from the code review:

```bash
# Make necessary changes to files based on review feedback
# Example: Fix type definitions, update documentation, refactor code

# Run quality checks before responding
bun run type-check
bun test
bun run lint:fix
```

### 3. Respond to Review Comments

Use `gh please pr review-reply` to respond to each review comment with acknowledgment and commit reference:

```bash
# Reply to a single review comment
gh please pr review-reply <comment-id> -b "Thanks for catching this! Fixed in <commit-hash>"

# Example with actual comment ID
gh please pr review-reply 2442802556 -b "Fixed PluginType definition mismatch in commit 75dcaac"
```

**Response Best Practices:**
- Include the commit hash that addresses the feedback
- Keep responses brief and professional
- Confirm understanding of the issue
- Reference the fix location when applicable
- For multiple related comments, batch similar responses

### 4. Resolve Review Threads

After addressing feedback and responding, resolve review threads:

```bash
# Resolve all threads on a PR (recommended after addressing all feedback)
gh please pr resolve <pr-number> --all

# Resolve a specific thread
gh please pr resolve <pr-number> --thread <thread-id>
```

**Example Workflow:**

```bash
# 1. Apply feedback to files
# (edit files based on review comments)

# 2. Commit the changes
git add .
git commit -m "fix: address code review feedback from PR #23"
git push

# 3. Respond to comments (assuming comment IDs: 2442802556, 2442802557, ...)
gh please pr review-reply 2442802556 -b "Fixed in 75dcaac"
gh please pr review-reply 2442802557 -b "Updated in 75dcaac"
gh please pr review-reply 2442802560 -b "Implemented in 75dcaac"

# 4. Resolve all threads
gh please pr resolve 23 --all
```

### 5. Push Changes and Update PR

After responding and resolving threads, the PR is ready for merge:

```bash
# Verify all changes are pushed
git log -1 --oneline
git status

# PR is now ready for merge with all feedback addressed and threads resolved
```

**Complete Workflow Summary:**

```
┌─────────────────────────────────────┐
│ 1. Receive Code Review Feedback     │
│    Review comments on PR            │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Apply Feedback                   │
│    Edit files, run checks, commit   │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Respond to Comments              │
│    gh please pr review-reply        │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Resolve Threads                  │
│    gh please pr resolve --all       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. PR Ready for Merge               │
│    All feedback addressed           │
└─────────────────────────────────────┘
```

### Related Commands

For additional PR management:

```bash
# List all PRs with review comments
gh pr list --search "review-requested:@me"

# View specific PR details
gh pr view <pr-number> --json reviews,comments

# Check PR review status
gh pr checks <pr-number>
```

## Issue Development Workflow

The `gh please issue develop` command streamlines the process of starting work on an issue with automatic worktree creation for isolated development.

### Default Mode (Worktree)

```bash
# Basic usage - creates isolated workspace in ~/worktrees/{repo}/{branch}
gh please issue develop 123

# With base branch
gh please issue develop 123 --base main

# With custom branch name
gh please issue develop 123 --name my-custom-branch

# From outside git repo
gh please issue develop 123 --repo owner/repo

# Output shows command to navigate to worktree
# cd ~/worktrees/gh-please/feat-123-awesome-feature

# If bare repo doesn't exist, interactive prompt will ask to clone
# Clone happens automatically to ~/repos/{owner}/{repo}.git
```

### Checkout Mode

```bash
# Checkout branch in current repo instead of creating worktree
gh please issue develop 123 --checkout

# This mode requires being in a git repository
# Useful when you want to work in your existing repo instead of a separate worktree
```

### Using Aliases

```bash
# 'dev' is an alias for 'develop'
gh please issue dev 123          # Creates worktree (default)
gh please issue dev 123 --checkout  # Checkout branch instead
```

### Cleanup Worktrees

```bash
# Interactive selection of prunable worktrees to remove
gh please issue cleanup

# Remove all prunable worktrees without prompt
gh please issue cleanup --all

# Cleanup from outside repo
gh please issue cleanup --repo owner/repo
```

### Architecture & Implementation

The develop workflow uses:
- **`gh issue develop`**: GitHub CLI command for branch management
- **Bare repository**: Clone at `~/repos/{owner}/{repo}.git` for efficient multi-worktree setup
- **Git worktrees**: Isolated workspaces at `~/worktrees/{repo}/{branch}`
- **Automatic fallback**: If bare repo exists locally, uses it; otherwise, prompts to clone

### Key Features

1. **Works Everywhere**: Can be used inside or outside a git repo via `--repo` flag
2. **Automatic Bare Clone**: First worktree creation automatically clones repo as bare (once only)
3. **Efficient Disk Usage**: Multiple worktrees share objects, saving disk space
4. **Interactive Cleanup**: Manage prunable worktrees interactively or in batch mode
5. **Bilingual Support**: Full Korean/English support for all messages

## Launcher Script

`gh-extension-please` is a bash script that:

1. Checks for Bun installation
2. Runs compiled version from `dist/index.js` if available
3. Falls back to source at `src/index.ts` for development

This allows the extension to work in both development and production modes.
