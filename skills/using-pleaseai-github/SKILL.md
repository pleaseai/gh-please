---
name: using-github-please-extension
version: 1.2.0
lastUpdated: 2025-10-31
description: gh-please CLI extension command reference and syntax guide. Enhanced gh CLI replacement providing command syntax, options, and execution examples for sub-issues, dependencies, PR review threads, worktrees, and TOON format output (58.9% token reduction). Use when needing CLI command syntax, 'gh please 명령어', 'gh please 사용법', execution examples, or gh-please specific features. For organizational workflow standards, see your organization's GitHub plugin.
allowed-tools: Read, Bash, Grep, Glob, Edit, WebFetch
---

# Using GitHub Please Extension

Quick reference for automating GitHub workflows with the `gh-please` CLI extension.

## Installation

```bash
# Install extension
gh extension install pleaseai/gh-please

# Verify installation
gh extension list  # Should show gh-please
```

## Quick Reference

### gh CLI Passthrough

gh-please automatically supports **all** GitHub CLI commands through passthrough functionality. When a command is not explicitly registered (issue, pr, plugin), it forwards to the native gh CLI with optional format conversion.

**Key Benefits:**
- ✅ Access all 100+ gh CLI commands through gh-please
- ✅ Automatic format conversion (TOON, JSON, Markdown, XML)
- ✅ No manual updates needed - new gh CLI features work immediately

**Usage:**

```bash
# Use any gh command through gh-please (preserves original output)
gh please repo view
gh please workflow list
gh please release view v1.0.0

# Convert to TOON format (58.9% token reduction for LLMs)
gh please issue list --format toon
gh please pr list --state open --format toon
gh please repo view --format toon

# Convert to JSON for automation
gh please workflow list --format json
gh please pr checks 123 --format json

# Other formats
gh please issue list --format markdown  # Markdown tables
gh please issue list --format xml       # XML output
```

**How it works:**
1. Unknown commands automatically forward to `gh` CLI
2. `--format toon/json/markdown/xml` triggers format conversion
3. Requires command support for `--json` flag
4. Registered gh-please commands (issue, pr) take priority

**Examples:**

```bash
# Repository operations
gh please repo view --format toon

# Workflow management
gh please workflow list --format json

# Release management
gh please release list --format toon

# Any gh command works!
gh please api repos/:owner/:repo --format json
```

### Issue Management

Create issues with types, manage hierarchical structures, dependencies, and streamline development workflows:

#### Issue Creation and Types

| Command | Description | Example |
|---------|-------------|---------|
| `issue create` | Create issue with optional type | `gh please issue create --title "Fix bug" --type Bug` |
| `issue type list` | List available issue types | `gh please issue type list [--json name,color]` |
| `issue type set <issue>` | Set/update issue type | `gh please issue type set 123 --type Feature` |
| `issue type remove <issue>` | Remove issue type | `gh please issue type remove 123` |

```bash
# Create issue with type (by name)
gh please issue create --title "Login fails on Safari" --type Bug

# Create issue with type (by Node ID)
gh please issue create --title "Add dark mode" --type-id "IT_kwDO..." --json

# List available issue types
gh please issue type list
gh please issue type list --json name,color  # For scripts

# Set type on existing issue
gh please issue type set 123 --type Feature
gh please issue type set 123 --type-id "IT_kwDO..."  # By Node ID

# Remove type from issue
gh please issue type remove 123
```

#### Sub-issues

| Command | Description | Example |
|---------|-------------|---------|
| `issue sub-issue create <parent>` | Create new sub-issue | `gh please issue sub-issue create 100 --title "Fix auth"` |
| `issue sub-issue add <parent> <child>` | Link existing issue | `gh please issue sub-issue add 100 101` |
| `issue sub-issue list <parent>` | Show all sub-issues | `gh please issue sub-issue list 100 [--format json]` |
| `issue sub-issue remove <parent> <child>` | Unlink sub-issue | `gh please issue sub-issue remove 100 101` |

```bash
# Create sub-issue with body
gh please issue sub-issue create 100 \
  --title "Add input validation" \
  --body "Validate email and password fields"

# Quick link
gh please issue sub-issue add 100 101  # Link #101 as sub-issue of #100
```

#### Dependencies

| Command | Description | Example |
|---------|-------------|---------|
| `issue dependency add <issue>` | Mark issue as blocked | `gh please issue dependency add 200 --blocked-by 199` |
| `issue dependency list <issue>` | Show blocking issues | `gh please issue dependency list 200 [--format json]` |
| `issue dependency remove <issue> <blocker>` | Remove dependency | `gh please issue dependency remove 200 199` |

```bash
# Issue #200 is blocked by #199
gh please issue dependency add 200 --blocked-by 199

# View all blockers
gh please issue dependency list 200
# Output: Issue #200 is blocked by: #199
```

#### Issue Development Workflow

| Command | Description | Example |
|---------|-------------|---------|
| `issue develop <issue>` | Create worktree for issue | `gh please issue develop 123` |
| `issue develop <issue> --checkout` | Checkout branch in current repo | `gh please issue develop 123 --checkout` |
| `issue cleanup` | Remove unused worktrees | `gh please issue cleanup [--all]` |

```bash
# Create isolated workspace at ~/.please/worktrees/repo/feat-123-feature
gh please issue develop 123

# Or checkout branch in current repo
gh please issue develop 123 --checkout

# Cleanup when done
gh please issue cleanup  # Interactive selection
gh please issue cleanup --all  # Remove all prunable worktrees
```

#### Comment Management

| Command | Description | Example |
|---------|-------------|---------|
| `issue comment list <issue>` | List issue comments | `gh please issue comment list 123 [--format json]` |
| `issue comment edit <comment-id>` | Edit issue comment | `gh please issue comment edit 987654321 --body "Updated"` |

```bash
# List all comments on issue
gh please issue comment list 123
gh please issue comment list 123 --format json  # For scripts

# Edit a comment
gh please issue comment edit 987654321 --body "Updated content"
```

### PR Reviews

Respond to review comments, manage discussion threads, and edit comments:

#### Reply to Comments

```bash
# Reply to review comment (supports both Database ID and Node ID)
gh please pr review reply 1234567890 -b "Fixed in latest commit"        # Database ID
gh please pr review reply PRRC_kwDOP34zbs6ShH0J -b "Fixed!"            # Node ID also supported

# Multi-line reply
gh please pr review reply 1234567890 --body "$(cat <<'EOF'
Good catch! I've updated the implementation:

1. Added error handling
2. Included unit tests
3. Updated documentation

Let me know if you have other concerns.
EOF
)"

# From stdin
echo "Thanks for the review!" | gh please pr review reply 1234567890
```

**Finding comment IDs:**
- **Database ID** (numeric): GitHub UI URL shows `#discussion_r1234567890` → use `1234567890`
- **Node ID** (string): Use `gh please pr review thread list <pr-number>` to get Node IDs
- Both formats are auto-detected and supported

**Limitation:** Only top-level review comments supported (API restriction).

#### Manage Review Threads

```bash
# List all review threads with Node IDs
gh please pr review thread list 456

# List only unresolved threads
gh please pr review thread list 456 --unresolved-only

# Resolve all threads
gh please pr review thread resolve 456 --all

# Resolve specific thread (use Node ID from list command)
gh please pr review thread resolve 456 --thread PRRT_kwDOABC123

# Cross-repo
gh please pr review thread resolve 456 --all --repo owner/repo
```

**Thread Node IDs:**
- Use `gh please pr review thread list <pr-number>` to get Node IDs
- Node IDs look like `PRRT_kwDO...` (GraphQL-only type)
- List command shows copy-ready resolve commands

#### Edit Comments

```bash
# Edit PR review comment (supports both Database ID and Node ID)
gh please pr review comment edit 1234567890 --body "Updated text" --pr 456     # Database ID (requires --pr)
gh please pr review comment edit PRRC_kwDOABC123 --body "Updated text"        # Node ID (--pr optional)

# Edit issue comment (supports both Database ID and Node ID)
gh please issue comment edit 987654321 --body "Corrected" --issue 123         # Database ID (requires --issue)
gh please issue comment edit IC_kwDOABC123 --body "Corrected"                 # Node ID (--issue optional)
```

**ID Requirements:**
- **Database ID**: Requires `--pr <number>` or `--issue <number>` for conversion to Node ID
- **Node ID**: Can be used directly without additional options

## Output Formats

All list commands support LLM-friendly output formats optimized for different use cases.

### TOON Format (Recommended for LLMs)

**TOON (Tree Object Outline Notation)** is a hierarchical text format optimized for LLM token efficiency:

- **58.9% token reduction** compared to JSON
- Hierarchical structure using indentation
- Human-readable and machine-parseable
- Ideal for AI/LLM context windows

**Example:**

```bash
gh please issue sub-issue list 123 --format toon
```

**Output:**
```
Issue
  number: 123
  title: "Epic: User Authentication"
  state: OPEN
  sub_issues
    Issue
      number: 124
      title: "Add OAuth"
      state: OPEN
    Issue
      number: 125
      title: "Session management"
      state: CLOSED
```

### Other Formats

```bash
# JSON - For scripts and automation
gh please issue sub-issue list 123 --format json

# Markdown - For documentation
gh please issue sub-issue list 123 --format markdown

# XML - For XML-based processing
gh please issue sub-issue list 123 --format xml

# Default (human-readable tables)
gh please issue sub-issue list 123
```

### Format Comparison

| Format | Token Efficiency | Use Case | Machine-Readable |
|--------|-----------------|----------|------------------|
| **TOON** | ⭐⭐⭐⭐⭐ (58.9% reduction) | LLM context, AI automation | ✅ |
| **JSON** | ⭐⭐⭐ (baseline) | Scripts, APIs, data exchange | ✅ |
| **Markdown** | ⭐⭐⭐⭐ | Documentation, human reading | Partial |
| **XML** | ⭐⭐ (verbose) | XML-based systems | ✅ |
| **Default** | ⭐⭐⭐⭐ | Terminal, human interaction | ❌ |

### Supported Commands

All list commands support format conversion:
- `issue sub-issue list`
- `issue dependency list`
- `issue comment list`
- `issue type list`
- `pr review thread list`
- All gh CLI commands with `--json` support (via passthrough)

## Common Patterns

### Issue Development Workflow

```bash
# 1. Start work on issue with isolated workspace
gh please issue develop 123
# → Creates ~/.please/worktrees/repo/feat-123-feature

# 2. Work in the worktree
cd ~/.please/worktrees/repo/feat-123-feature
# ... make changes, commit, push ...

# 3. Create PR
gh pr create --title "Fix #123"

# 4. Clean up when merged
gh please issue cleanup
```

### Epic Organization

```bash
# Epic #100: User Authentication
gh please issue sub-issue create 100 --title "OAuth integration"    # #101
gh please issue sub-issue create 100 --title "Session management"   # #102
gh please issue sub-issue create 100 --title "Password reset flow"  # #103

# Add dependency: Session requires OAuth
gh please issue dependency add 102 --blocked-by 101

# View hierarchy
gh please issue sub-issue list 100
# Output:
# 🟢 #101: OAuth integration
# 🔴 #102: Session management (blocked by #101)
# 🟢 #103: Password reset flow
```

### Review Response Workflow

```bash
# 1. List review threads to see what needs addressing
gh please pr review thread list 456

# 2. Reply to specific review comments (use Database ID)
gh please pr review reply 1234567890 -b "Updated error handling in commit abc123"
gh please pr review reply 1234567891 -b "Added tests for edge cases"

# 3. After addressing all feedback, resolve threads
gh please pr review thread resolve 456 --all

# 4. Request re-review
gh pr ready 456
gh pr comment 456 --body "All feedback addressed, ready for re-review"
```

## Advanced Topics

For detailed information, see the reference documentation:

- **[ISSUE-MANAGEMENT.md](./reference/ISSUE-MANAGEMENT.md)** - Epic → Feature → Task patterns, GraphQL API details
- **[PR-REVIEWS.md](./reference/PR-REVIEWS.md)** - Comment ID discovery, review best practices

## Troubleshooting

**"command not found: gh please"**
```bash
# Extension not installed
gh extension install pleaseai/gh-please
```

**"failed to get repository info"**
```bash
# Not in a git repository
cd /path/to/your/repo

# Or use --repo flag
gh please issue sub-issue list 123 --repo owner/repo
```

**"GraphQL error: sub_issues feature required"**
```bash
# Feature flag automatically included by extension
# If error persists, check GitHub API status
```

**"comment not found" (review reply)**
```bash
# Get comment Database ID from GitHub UI:
# URL: github.com/.../pull/123#discussion_r1234567890
# Use: 1234567890 (numeric part after discussion_r)

# Or list threads to find Node IDs:
gh please pr review thread list 123
```

## GitHub ID Systems

GitHub uses three ID systems:

1. **Number (Issue/PR Number)** - Most user-friendly
   - Format: `#123`, `#456`
   - Use for: Issue and PR identification
   - Example: `gh please issue sub-issue add 14 16`

2. **Database ID** - REST API identifier
   - Format: Large integer like `1234567890`
   - Use for: Comments (auto-detected from numeric input)
   - Example: `gh please pr review reply 1234567890 -b "Fixed"`
   - Note: Automatically converted to Node ID internally

3. **Node ID** - GraphQL global identifier
   - Format: Base64 string like `PRRC_kwDOABC123`, `IC_kwDOABC123`
   - Use for: Comments (direct), Review threads (required)
   - Examples:
     - `gh please pr review reply PRRC_kwDOABC123 -b "Fixed"`
     - `gh please pr review thread resolve 456 --thread PRRT_kwDOABC123`

**When to use which:**
- Always use **Number** for issues and PRs
- Use **Database ID** or **Node ID** for comments (both auto-detected)
- Use **Node ID** for threads (from `thread list` command)

**ID Converter (v0.11.0+):**
All comment operations now support both Database ID and Node ID:
- **Database ID** → Automatically converted to Node ID via REST API
- **Node ID** → Used directly (no conversion needed)
- Auto-detection based on format pattern

## Tips

- Use `--repo` flag to manage issues across multiple repositories
- Use `issue develop` to create isolated worktrees for each issue
- Create sub-issues before starting work to track progress
- Reply to review comments as you address them (better UX for reviewers)
- Use `thread list` to get Node IDs before resolving specific threads
- Use `--format json` for automation and scripting
- Clean up worktrees with `issue cleanup` after PR is merged

---

**Extension Version:** 0.18.0
**Last Updated:** 2025-10-30
