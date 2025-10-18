# gh-extension-please

GitHub CLI extension for managing pull requests with enhanced functionality.

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
gh extension install <your-username>/gh-extension-please
```

### Development Installation

```bash
git clone https://github.com/<your-username>/gh-extension-please.git
cd gh-extension-please
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
gh-extension-please/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── github-api.ts     # GitHub API wrapper
│   └── types.ts          # TypeScript type definitions
├── script/
│   └── build.sh          # Build script for releases
├── gh-extension-please   # Launcher script
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
# Run directly with bun
bun run src/index.ts review-reply --help

# Or use the launcher script
./gh-extension-please review-reply --help
```

### Type Checking

```bash
bun run type-check
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Related Documentation

- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Creating GitHub CLI Extensions](https://docs.github.com/en/enterprise-cloud@latest/github-cli/github-cli/creating-github-cli-extensions)
- [GitHub REST API - Pull Request Review Comments](https://docs.github.com/en/rest/pulls/comments)
- [Bun Documentation](https://bun.sh/docs)
