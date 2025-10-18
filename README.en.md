# @pleaseai/github

[![CI](https://github.com/pleaseai/gh-please/actions/workflows/ci.yml/badge.svg)](https://github.com/pleaseai/gh-please/actions/workflows/ci.yml)
[![codecov](https://codecov.io/github/pleaseai/gh-please/graph/badge.svg?token=BQKO959X1M)](https://codecov.io/github/pleaseai/gh-please)
[![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)

GitHub CLI extension for **PleaseAI** - AI-powered code review and issue management automation.

[한국어](./README.md) | English

## Overview

`@pleaseai/github` is the command-line interface for PleaseAI, providing intelligent automation for:

- **Code Review**: Automated PR reviews with AI-generated comments and suggestions
- **Issue Workflow**: Streamlined triage → investigate → fix workflow for issues
- **Review Management**: Reply to PR review comments and manage discussions
- **Code Workspace**: Enhanced development workspace features

## Quick Start

1. **Install the extension**

   ```bash
   gh extension install pleaseai/gh-please
   ```

2. **Navigate to your repository**

   ```bash
   cd your-project
   ```

3. **Initialize PleaseAI configuration**

   ```bash
   gh please init
   ```

   This creates `.please/config.yml` with your preferences for code review automation, issue workflows, and more.

4. **Start using PleaseAI features**
   - Automatic PR reviews based on your configuration
   - AI-powered issue triage and investigation
   - Reply to review comments: `gh please review-reply <comment-id> -b "your reply"`

## Features

### `gh please init` - Initialize PleaseAI Configuration

Set up `.please/config.yml` with interactive configuration for all PleaseAI features:

- Code review automation (severity thresholds, auto-review, draft PR handling)
- Issue workflow automation (auto-triage, investigation, fix workflows)
- Code workspace features
- Language preferences (Korean/English)

```bash
# Interactive configuration
gh please init

# Use defaults (skip prompts)
gh please init --yes

# Overwrite existing config
gh please init --force
```

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

## PleaseAI Configuration

The `.please/config.yml` file controls all PleaseAI automation features:

### Code Review Settings

- **comment_severity_threshold**: Minimum severity level for review comments (LOW/MEDIUM/HIGH)
- **max_review_comments**: Maximum number of review comments (-1 for unlimited)
- **auto review**: Automatically review PRs when opened
- **include_drafts**: Include draft PRs in automatic reviews

### Issue Workflow Settings

- **Triage**: Automatic or manual issue triage with type labeling
- **Investigate**: AI-assisted bug investigation (org members only option)
- **Fix**: Automated fix implementation with PR creation and test execution

### Code Workspace

- Enable enhanced development workspace features

### Example Configuration

```yaml
code_review:
  disable: false
  comment_severity_threshold: MEDIUM
  max_review_comments: -1
  pull_request_opened:
    help: false
    summary: true
    code_review: true
    include_drafts: true

issue_workflow:
  disable: false
  triage:
    auto: true
    manual: true
    update_issue_type: true
  investigate:
    enabled: true
    org_members_only: true
    auto_on_bug_label: false
  fix:
    enabled: true
    org_members_only: true
    require_investigation: false
    auto_create_pr: true
    auto_run_tests: true

code_workspace:
  enabled: true

ignore_patterns: []
language: ko
```

## Command Reference

### `gh please init`

Initialize `.please/config.yml` with interactive configuration.

**Options:**

- `-f, --force` - Overwrite existing config file
- `-y, --yes` - Skip prompts and use default configuration

**Examples:**

```bash
# Interactive setup (recommended for first-time setup)
gh please init

# Quick setup with defaults
gh please init --yes

# Overwrite existing configuration
gh please init --force
```

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

Trigger PleaseAI automation workflows for code review and issue management.

#### `gh please ai triage <issue-number>`

Trigger PleaseAI to automatically triage an issue (categorize, add labels, etc.).

```bash
gh please ai triage 123
```

#### `gh please ai investigate <issue-number>`

Trigger PleaseAI to investigate a bug or issue in detail.

```bash
gh please ai investigate 123
```

#### `gh please ai fix <issue-number>`

Trigger PleaseAI to attempt an automated fix for an issue.

```bash
gh please ai fix 123
```

#### `gh please ai review <pr-number>`

Trigger PleaseAI to perform code review on a pull request.

```bash
gh please ai review 456
```

#### `gh please ai apply <pr-number>`

Trigger PleaseAI to apply its suggestions to a pull request.

```bash
gh please ai apply 456
```

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

#### `gh please pr review-reply <comment-id> --body "..."`

Create a reply to a PR review comment. Replaces deprecated `gh please review-reply`.

**Arguments:**

- `<comment-id>` - ID of the review comment (found in comment URL)

**Options:**

- `-b, --body <text>` - Reply text (required if not piping)

**Examples:**

```bash
# Direct reply
gh please pr review-reply 1234567890 --body "Fixed in latest commit!"

# Pipe from file
cat reply.txt | gh please pr review-reply 1234567890

# Multiline reply
gh please pr review-reply 1234567890 --body "$(cat <<'EOF'
Looks good, but:

1. Please add error handling
2. Add unit tests for edge cases

Thanks for the fix!
EOF
)"
```

#### `gh please pr resolve <pr-number> [--thread <id> | --all]`

Resolve review threads on a pull request.

**Arguments:**

- `<pr-number>` - Pull request number

**Options:**

- `--thread <id>` - Resolve specific thread
- `--all` - Resolve all unresolved threads

**Examples:**

```bash
# Resolve all threads
gh please pr resolve 456 --all

# Resolve specific thread
gh please pr resolve 456 --thread MDEyOlB1bGxSZXF1ZXN0UmV2aWV3VGhyZWFk...
```

### Backward Compatibility

The old `gh please review-reply` command still works but shows a deprecation warning. Please migrate to `gh please pr review-reply`.

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
@pleaseai/github/
├── src/
│   ├── commands/         # Command implementations
│   │   ├── init.ts      # Initialize PleaseAI config
│   │   └── review-reply.ts  # Reply to PR comments
│   ├── config/          # Configuration schema and validation
│   │   └── schema.ts    # Zod schemas for .please/config.yml
│   ├── lib/             # Reusable utilities
│   │   ├── github-api.ts    # GitHub API helpers
│   │   ├── validation.ts    # Input validation
│   │   └── i18n.ts         # Internationalization (ko/en)
│   ├── index.ts         # CLI entry point
│   └── types.ts         # TypeScript type definitions
├── test/
│   ├── commands/        # Command tests
│   ├── lib/             # Library tests
│   │   ├── github-api.test.ts
│   │   └── validation.test.ts
│   └── fixtures/        # Test data
│       └── mock-data.ts
├── script/
│   └── build.sh         # Build script for releases
├── gh-extension-please  # Launcher script
├── package.json
├── tsconfig.json
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
