# @pleaseai/github

[![CI](https://github.com/pleaseai/gh-please/actions/workflows/ci.yml/badge.svg)](https://github.com/pleaseai/gh-please/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/pleaseai/gh-please/graph/badge.svg?token=BQKO959X1M)](https://codecov.io/github/pleaseai/gh-please)
[![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)

GitHub CLI extension for **PleaseAI** - AI-powered code review and issue management automation.

[한국어](./README.md) | English

## Overview

`@pleaseai/gh-please` is a powerful GitHub CLI extension that enhances issue and PR management:

### Core Features (Built-in)
- **Issue Management**: Sub-issue and dependency relationship management
- **PR Management**: Review comment replies and thread resolution
- **Plugin System**: Extensible architecture for custom functionality

### AI Features (Plugin Required)
AI-powered code review and issue management features are available as a separate plugin. See [Available Plugins](./docs/AVAILABLE_PLUGINS.md) for details.

## Quick Start

### Using Core Features (No Plugin Required)

1. **Install the extension**

   ```bash
   gh extension install pleaseai/gh-please
   ```

2. **Start using commands immediately**

   ```bash
   # Issue management
   gh please issue sub-issue create 100 --title "Sub task"
   gh please issue dependency add 200 --blocked-by 199

   # PR management
   gh please pr review reply 1234567890 -b "Fixed!"
   gh please pr review thread resolve 456 --all
   ```

### Using AI Features (Plugin Required)

For AI plugin installation and usage, see [Available Plugins](./docs/AVAILABLE_PLUGINS.md).

## Common Options

All commands support the `--repo` option to operate on repositories other than the current directory:

```bash
# Use current directory's repository (default)
gh please issue sub-issue list 123

# Specify a different repository
gh please issue sub-issue list 123 --repo owner/repo
gh please issue sub-issue list 123 -R owner/repo  # Short form

# Available on all commands
gh please issue dependency add 200 --blocked-by 199 --repo owner/repo
gh please pr review thread resolve 456 --all -R owner/repo
```

**Note**: Without the `--repo` option, the command uses the repository in the current directory.

## Features

### `gh please review-reply` - Reply to PR Review Comments

Create a reply to a pull request review comment using the GitHub API.

**Note**: This command only supports replying to **top-level review comments**. Replies to replies are not supported by the GitHub API.

## Installation

### Prerequisites

- [GitHub CLI (`gh`)](https://cli.github.com/) - version 2.0 or later
- [Bun](https://bun.sh) - JavaScript runtime and toolkit

### Install the extension

```bash
gh extension install pleaseai/gh-please
```

### Development Installation

```bash
git clone https://github.com/pleaseai/gh-please.git
cd gh-please
bun install
gh extension install .
```

## Usage

### Reply to a Review Comment

Navigate to a repository with an open pull request and run:

```bash
# Basic usage
gh please review-reply <comment-id> --body "Your reply text here"

# Using short flag
gh please review-reply 1234567890 -b "Thanks for the review!"

# Multiline reply
gh please review-reply 1234567890 --body "Good catch!

I'll update this in the next commit."

# Pipe from stdin
echo "Thanks!" | gh please review-reply 1234567890
```

### Finding Comment IDs

To find the comment ID you want to reply to:

1. **Via GitHub CLI API**:

   ```bash
   gh api /repos/OWNER/REPO/pulls/PR_NUMBER/comments
   ```

2. **Via GitHub Web UI**:
   - Navigate to the PR and click on a review comment
   - The comment ID is in the URL: `github.com/.../pull/123#discussion_r1234567890`
   - Use the number after `discussion_r` (e.g., `1234567890`)

3. **Using gh CLI (list all PR comments)**:
   ```bash
   gh pr view --json comments --jq '.comments[] | "\(.id): \(.body)"'
   ```

## Internationalization (i18n)

All commands automatically detect the system language and display messages in Korean or English.

**Supported Languages:**
- Korean (ko) - When system language is set to Korean
- English (en) - Default and for all other languages

**Language Detection:**
The CLI checks the following environment variables in order to auto-detect the language:
1. `LANG`
2. `LANGUAGE`
3. `LC_ALL`

If the environment variable starts with `ko`, Korean messages are displayed; otherwise, English messages are shown.

**Examples:**
```bash
# Korean messages
LANG=ko_KR.UTF-8 gh please issue sub-issue list 123
# Output: 🔍 상위 이슈 #123 가져오는 중...

# English messages
LANG=en_US.UTF-8 gh please issue sub-issue list 123
# Output: 🔍 Getting parent issue #123...
```

**Coverage:**
- ✅ All command output messages (success, errors, progress)
- ⚠️ GitHub API URLs and links are not internationalized

## Command Reference

### `gh please review-reply`

Create a reply to a PR review comment.

**Arguments:**

- `<comment-id>` - The ID of the review comment to reply to (required)

**Options:**

- `-b, --body <text>` - The reply body text (required, or provide via stdin)

**Examples:**

```bash
# Simple reply
gh please review-reply 1234567890 -b "Fixed in the latest commit!"

# Reply with context from the current directory
# (automatically detects the current PR)
cd my-project
git checkout my-feature-branch
gh please review-reply 1234567890 -b "Good point, I'll refactor this."

# Using heredoc for multiline replies
gh please review-reply 1234567890 --body "$(cat <<'EOF'
Thanks for catching this!

I've updated the implementation to:
1. Add proper error handling
2. Include unit tests
3. Update documentation

Let me know if you have any other concerns.
EOF
)"
```

### AI Commands

> **Plugin Required**: AI commands require a separate plugin installation.
> See [Available Plugins](./docs/AVAILABLE_PLUGINS.md) for details.

### Issue Management Commands

Manage GitHub issues with sub-issues and dependencies.

#### `gh please issue sub-issue <subcommand> [options]`

Manage issue sub-issues (hierarchical issue relationships).

**Subcommands:**

- `create <parent-issue> --title "..."` - Create a new sub-issue linked to parent
- `add <parent-issue> <child-issue>` - Link existing issue as sub-issue
- `remove <parent-issue> <child-issue>` - Unlink sub-issue from parent
- `list <parent-issue>` - List all sub-issues of a parent issue

**Examples:**

```bash
# Create a new sub-issue
gh please issue sub-issue create 100 --title "Fix validation logic" --body "Add validation for user input"

# Link existing issues
gh please issue sub-issue add 100 101
gh please issue sub-issue add 100 102

# List all sub-issues
gh please issue sub-issue list 100

# Remove a sub-issue link
gh please issue sub-issue remove 100 101
```

#### `gh please issue dependency <subcommand> [options]`

Manage issue dependencies using "blocked by" relationships.

**Subcommands:**

- `add <issue> --blocked-by <blocker>` - Mark an issue as blocked by another
- `remove <issue> <blocker>` - Remove a blocking dependency
- `list <issue>` - List all issues blocking a given issue

**Examples:**

```bash
# Mark issue as blocked
gh please issue dependency add 200 --blocked-by 199

# View blocking issues
gh please issue dependency list 200

# Remove blocking relationship
gh please issue dependency remove 200 199
```

### PR Management Commands

Manage pull request reviews and threads.

#### `gh please pr review reply <comment-id> --body "..."`

Create a reply to a PR review comment.

**Arguments:**

- `<comment-id>` - ID of the review comment (found in comment URL)

**Options:**

- `-b, --body <text>` - Reply text (required if not piping)

**Examples:**

```bash
# Direct reply
gh please pr review reply 1234567890 --body "Fixed in latest commit!"

# Pipe from file
cat reply.txt | gh please pr review reply 1234567890

# Multiline reply
gh please pr review reply 1234567890 --body "$(cat <<'EOF'
Looks good, but:

1. Please add error handling
2. Add unit tests for edge cases

Thanks for the fix!
EOF
)"
```

#### `gh please pr review thread resolve <pr-number> [--thread <id> | --all]`

Resolve review threads on a pull request.

**Arguments:**

- `<pr-number>` - Pull request number

**Options:**

- `--thread <id>` - Resolve specific thread
- `--all` - Resolve all unresolved threads

**Examples:**

```bash
# Resolve all threads
gh please pr review thread resolve 456 --all

# Resolve specific thread
gh please pr review thread resolve 456 --thread MDEyOlB1bGxSZXF1ZXN0UmV2aWV3VGhyZWFk...
```

### Backward Compatibility

The old commands still work but show deprecation warnings:
- `gh please review-reply` → Migrate to `gh please pr review reply`
- `gh please pr review-reply` → Migrate to `gh please pr review reply`
- `gh please pr resolve` → Migrate to `gh please pr review thread resolve`

## API Limitations

### Top-level Comments Only

This extension uses the GitHub API endpoint:

```
POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies
```

**Important**: This endpoint only accepts top-level review comments as the `comment_id`. If you try to reply to a comment that is itself a reply, the API will return an error.

**What works**:

- ✅ Replying to a review comment on a specific line of code
- ✅ Replying to a review comment on a file

**What doesn't work**:

- ❌ Replying to a reply (nested replies)

### Rate Limiting

GitHub API has rate limits. For authenticated requests (which `gh` CLI uses), you typically get:

- 5,000 requests per hour for user-to-server requests

Check your current rate limit:

```bash
gh api rate_limit
```

## Development

### Project Structure

```
@pleaseai/gh-please/
├── src/
│   ├── commands/         # Command implementations
│   │   ├── issue/       # Issue management commands
│   │   ├── pr/          # PR management commands
│   │   └── plugin.ts    # Plugin management
│   ├── lib/             # Reusable utilities
│   │   ├── github-api.ts      # GitHub REST API
│   │   ├── github-graphql.ts  # GitHub GraphQL API
│   │   ├── validation.ts      # Input validation
│   │   └── i18n.ts           # Internationalization
│   ├── plugins/         # Plugin system
│   │   ├── plugin-interface.ts
│   │   └── plugin-registry.ts
│   ├── index.ts         # CLI entry point
│   └── types.ts         # TypeScript type definitions
├── test/
│   ├── commands/        # Command tests
│   ├── lib/             # Library tests
│   ├── integration/     # Integration tests
│   └── fixtures/        # Test data
├── plugins/             # Plugins (git submodules)
│   └── ai/             # AI plugin (private)
├── script/
│   └── build.sh         # Build script for releases
├── gh-extension-please  # Launcher script
└── README.md
```

### Building

```bash
# Build for all platforms
./script/build.sh

# Build for development (single platform)
bun build src/index.ts --outdir dist --target bun --format esm
```

### Running Locally

```bash
# Run commands directly with bun
bun run src/index.ts init --help
bun run src/index.ts review-reply --help

# Or use the launcher script
./gh-extension-please init --help
./gh-extension-please review-reply --help
```

### Type Checking

```bash
bun run type-check
```

### Testing

The project includes a comprehensive multi-level testing strategy:

#### Quick Test Commands

```bash
# Run all automated tests (unit + integration)
bun run test:all

# Run unit tests only (fastest)
bun run test:unit

# Run integration tests (CLI execution)
bun run test:integration

# Run E2E tests (requires GITHUB_TEST_TOKEN)
export GITHUB_TEST_TOKEN=ghp_your_token
bun run test:e2e

# Run with coverage
bun run test:coverage

# Watch mode for development
bun run test:watch

# Manual smoke test (interactive)
bun run test:manual
```

#### Test Levels

**1. Unit Tests** (`test/lib/`, `test/commands/`)
- Fast execution (~100ms)
- Isolated function testing
- Mock GitHub API calls
- **87 test cases** across 13 test files

**2. Integration Tests** (`test/integration/cli/`)
- Medium speed (~2-5s)
- Full CLI command execution
- Mocked GitHub environment
- Tests all command groups (AI, issue, PR)

**3. E2E Tests** (`test/e2e/`) - Optional
- Real GitHub API testing
- Requires `GITHUB_TEST_TOKEN`
- Auto-cleanup after tests
- Tests critical workflows (sub-issue, dependency)

**4. Manual Testing**
- Automated smoke test script: `./scripts/manual-test.sh`
- Comprehensive guide: `docs/testing/manual-testing-guide.md`

#### Coverage

| Component | Tests | Coverage Target |
|-----------|-------|-----------------|
| Unit Tests | 87 tests | 90%+ |
| Integration | Comprehensive | 80%+ |
| E2E | Critical paths | Sub-issue, Dependency |

See [Testing Overview](docs/testing/testing-overview.md) for detailed documentation.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Documentation

- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Creating GitHub CLI Extensions](https://docs.github.com/en/enterprise-cloud@latest/github-cli/github-cli/creating-github-cli-extensions)
- [GitHub REST API - Pull Request Review Comments](https://docs.github.com/en/rest/pulls/comments)
- [Bun Documentation](https://bun.sh/docs)
