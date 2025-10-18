# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@docs/STANDARDS.md
@docs/commit-convention.md
@docs/TESTING.md
@docs/TDD.md

## Project Overview

This is **@pleaseai/github**, a GitHub CLI extension for PleaseAI - an AI-powered code review and issue management automation service. It provides enhanced functionality for managing pull requests and issue workflows through the `gh` CLI.

**Key Features:**
- Initialize PleaseAI configuration (`.please/config.yml`)
- Reply to PR review comments via GitHub API
- Configure code review automation (severity thresholds, auto-review, draft PR handling)
- Configure issue workflow automation (triage → investigate → fix)
- Bilingual support (Korean/English)
- Built with Bun runtime and TypeScript

## Development Commands

### Building and Running

```bash
# Build the project
bun build src/index.ts --outdir dist --target bun --format esm

# Run directly from source (development)
bun run src/index.ts <command> [options]

# Run via launcher script
./gh-extension-please <command> [options]

# Type checking
bun run type-check
```

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
# AI commands
gh please ai triage 123
gh please ai review 456

# Issue commands
gh please issue sub-issue list 123
gh please issue dependency add 123 --blocked-by 124

# PR commands
gh please pr review-reply 987654 -b "Great work!"
gh please pr resolve 456 --all

# Configuration
gh please init

# Backward compatibility
gh please review-reply 987654 -b "text"  # Works but shows deprecation warning
```

## Architecture

### Command Structure (v0.2.0)

The CLI uses **commander.js** for command parsing with a modular, grouped command structure:

```bash
# AI Group (PleaseAI triggers)
gh please ai triage <issue-number>         # Trigger triage bot
gh please ai investigate <issue-number>    # Trigger investigation
gh please ai fix <issue-number>            # Trigger fix workflow
gh please ai review <pr-number>            # Trigger PR review
gh please ai apply <pr-number>             # Apply bot suggestions

# Issue Group (Direct API calls)
gh please issue sub-issue create <parent> --title "..."   # Create linked sub-issue
gh please issue sub-issue add <parent> <child>            # Link existing issue
gh please issue sub-issue remove <parent> <child>         # Unlink sub-issue
gh please issue sub-issue list <parent>                   # List all sub-issues
gh please issue dependency add <issue> --blocked-by <blocker>     # Add blocker
gh please issue dependency remove <issue> <blocker>               # Remove blocker
gh please issue dependency list <issue>                           # List blockers

# PR Group (Direct API calls)
gh please pr review-reply <comment-id> -b "text"  # Reply to review comment
gh please pr resolve <pr-number> [--thread <id> | --all]   # Resolve threads

# Configuration
gh please init                               # Initialize .please/config.yml

# Deprecated (still works with warning)
gh please review-reply <comment-id> -b "text"   # → Use 'gh please pr review-reply'
```

**Directory structure:**
- **Entry point**: `src/index.ts` - Registers all command groups and deprecation handler
- **Commands**: `src/commands/` - Organized by group:
  - `ai/` - PleaseAI trigger commands (triage, investigate, fix, review, apply)
  - `issue/` - Issue management (sub-issue, dependency)
  - `pr/` - Pull request management (review-reply, resolve)
  - `init.ts` - Initialize `.please/config.yml` configuration file

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

- **`src/lib/please-trigger.ts`**: PleaseAI workflow automation
  - Triggers automation workflows via GitHub comments
  - Supports: triage, investigate, fix, review, apply triggers
  - Key functions: `buildTriggerComment()`, `triggerPleaseAIIssue()`, `triggerPleaseAIPr()`

- **`src/lib/validation.ts`**: Input validation
  - Validates comment IDs and reply body text
  - Uses Zod schemas for type-safe validation

### Configuration System

**Schema**: `src/config/schema.ts` defines the configuration structure using Zod schemas:
- `code_review`: Code review automation settings
- `issue_workflow`: Issue triage → investigate → fix workflow
- `code_workspace`: Workspace features
- Language support (ko/en)

**Generated file**: `.please/config.yml` (created by `gh please init`)

### Type Definitions

`src/types.ts` contains core type definitions:
- `PrInfo`: PR metadata (number, owner, repo)
- `ReviewComment`: GitHub review comment structure
- `ReplyOptions`: Parameters for creating replies
- `IssueInfo`: Issue metadata with optional Node ID
- `SubIssue`: Sub-issue information (number, title, state, nodeId)
- `BlockedByIssue`: Blocking issue information
- `ReviewThread`: Review thread metadata (id, isResolved, path, line)
- `PleaseTriggerType`: Union type for automation triggers (triage | investigate | fix | review | apply)

## GitHub API Integration

This extension uses the GitHub CLI (`gh`) as the authentication and API client:

### REST API Pattern
```typescript
// REST API calls use gh CLI subprocess pattern:
const proc = Bun.spawn(["gh", "api", endpoint, ...options], {
  stdout: "pipe",
  stderr: "pipe",
});
```

### GraphQL API Pattern
```typescript
// GraphQL queries/mutations via gh CLI:
const proc = Bun.spawn(["gh", "api", "graphql", "-f", "query=...", "-F", "var=..."], {
  stdout: "pipe",
  stderr: "pipe",
});
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
2. Run type checking: `bun run type-check`
3. Run tests: `bun test`
4. Test manually: `bun run src/index.ts <command> [options]`
5. Build: `bun build src/index.ts --outdir dist --target bun --format esm`
6. Install locally: `gh extension install .`
7. Test as extension: `gh please <command> [options]`

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

## Launcher Script

`gh-extension-please` is a bash script that:
1. Checks for Bun installation
2. Runs compiled version from `dist/index.js` if available
3. Falls back to source at `src/index.ts` for development

This allows the extension to work in both development and production modes.