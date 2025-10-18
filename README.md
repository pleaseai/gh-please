# @pleaseai/github

[![code style](https://antfu.me/badge-code-style.svg)](https://github.com/antfu/eslint-config)

GitHub CLI extension for **PleaseAI** - AI-powered code review and issue management automation.

## Overview

`@pleaseai/github` is the command-line interface for PleaseAI, providing intelligent automation for:
- **Code Review**: Automated PR reviews with AI-generated comments and suggestions
- **Issue Workflow**: Streamlined triage → investigate → fix workflow for issues
- **Review Management**: Reply to PR review comments and manage discussions
- **Code Workspace**: Enhanced development workspace features

## Quick Start

1. **Install the extension**
   ```bash
   gh extension install pleaseai/github
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
gh extension install pleaseai/github
```

### Development Installation

```bash
git clone https://github.com/pleaseai/github.git
cd github
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

The project includes comprehensive unit tests:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

**Test Coverage:**
- Input validation (comment IDs, reply bodies)
- GitHub API helpers (endpoint building, PR info parsing)
- Comment type detection (top-level vs replies)
- 16 test cases with 29 assertions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Documentation

- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Creating GitHub CLI Extensions](https://docs.github.com/en/enterprise-cloud@latest/github-cli/github-cli/creating-github-cli-extensions)
- [GitHub REST API - Pull Request Review Comments](https://docs.github.com/en/rest/pulls/comments)
- [Bun Documentation](https://bun.sh/docs)
