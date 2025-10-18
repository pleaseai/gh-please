# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@docs/STANDARDS.md
@docs/commit-convention.md
@docs/TESTING.md
@docs/TDD.md

## Project Overview

This is **gh-extension-please**, a GitHub CLI extension for the pleaseai service. It provides enhanced functionality for managing pull requests and issue workflows through the `gh` CLI.

**Key Features:**
- Reply to PR review comments via GitHub API
- Initialize configuration for pleaseai service features (code review, issue triage/investigate/fix workflows)
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
gh please review-reply <comment-id> -b "reply text"
gh please init
```

## Architecture

### Command Structure

The CLI uses **commander.js** for command parsing with a modular command pattern:

- **Entry point**: `src/index.ts` - Registers commands and handles CLI lifecycle
- **Commands**: `src/commands/` - Each command is a separate module that exports a Commander Command instance
  - `review-reply.ts` - Reply to PR review comments
  - `init.ts` - Initialize `.please/config.yml` configuration file

### Core Libraries

- **`src/lib/github-api.ts`**: GitHub API interaction layer
  - Wraps `gh api` CLI calls using `Bun.spawn`
  - Handles PR context detection, comment fetching, and reply creation
  - Key functions: `getCurrentPrInfo()`, `getReviewComment()`, `createReviewReply()`

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

## GitHub API Integration

This extension uses the GitHub CLI (`gh`) as the authentication and API client:

```typescript
// All API calls use gh CLI subprocess pattern:
const proc = Bun.spawn(["gh", "api", endpoint, ...options], {
  stdout: "pipe",
  stderr: "pipe",
});
```

**Key API operations:**
- `gh pr view --json number,owner,repository` - Get current PR context
- `GET /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}` - Fetch comment
- `POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies` - Create reply

**Important**: The reply endpoint only supports top-level review comments. Replies to replies are not supported by GitHub's API.

## Testing Strategy

Tests follow the **Arrange-Act-Assert** pattern and use Bun's built-in test runner:

- **`test/lib/github-api.test.ts`**: Tests for GitHub API helper functions (endpoint building, PR info parsing, comment type detection)
- **`test/lib/validation.test.ts`**: Tests for input validation logic
- **`test/fixtures/`**: Mock data and test helpers

**Coverage**: 16 test cases with 29 assertions covering validation, API helpers, and comment type detection.

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

## Launcher Script

`gh-extension-please` is a bash script that:
1. Checks for Bun installation
2. Runs compiled version from `dist/index.js` if available
3. Falls back to source at `src/index.ts` for development

This allows the extension to work in both development and production modes.