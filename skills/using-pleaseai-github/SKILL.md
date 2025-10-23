---
name: Using PleaseAI GitHub Extension
description: Automate GitHub workflows with gh-please CLI extension - trigger PleaseAI automation (triage, investigate, fix, review, apply), manage sub-issues and dependencies, reply to PR reviews, manage review threads, edit comments, and configure .please/config.yml. Use when user mentions gh please, /please, PleaseAI, create sub-issue, link sub-issue, add dependency, blocked-by, review-reply, review threads, comment management, worktree workflow, or extension commands.
allowed-tools: Read, Bash, Grep, Glob, Edit, WebFetch
---

# Using PleaseAI GitHub Extension

Quick reference for automating GitHub workflows with the `gh-please` CLI extension.

## Installation

```bash
# Install extension
gh extension install pleaseai/gh-please

# Verify installation
gh extension list  # Should show gh-please
```

## Quick Reference

### AI Workflows

Trigger PleaseAI automation on issues and PRs via `/please` comments:

| Command | Description | Example |
|---------|-------------|---------|
| `ai triage <issue>` | Auto-categorize issue, add labels | `gh please ai triage 123` |
| `ai investigate <issue>` | Deep bug analysis, log inspection | `gh please ai investigate 123` |
| `ai fix <issue>` | Automated fix attempt, create PR | `gh please ai fix 123` |
| `ai review <pr>` | Code review with security checks | `gh please ai review 456` |
| `ai apply <pr>` | Apply bot suggestions to PR | `gh please ai apply 456` |

**All commands support `--repo owner/repo` for cross-repository operations.**

```bash
# Current repo
gh please ai triage 123

# Different repo
gh please ai triage 123 --repo pleaseai/another-repo
gh please ai triage 123 -R owner/repo  # Short form
```

### Issue Management

Create hierarchical issue structures, manage dependencies, and streamline development workflows:

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
# Reply to review comment (use Database ID from GitHub UI)
gh please pr review reply 1234567890 -b "Fixed in latest commit"

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

**Finding comment Database ID:**
- GitHub UI: URL shows `#discussion_r1234567890` → use `1234567890`
- Use `gh please pr review comment list <pr-number>` to see all comments

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
# Edit PR review comment (use Database ID)
gh please pr review comment edit 1234567890 --body "Updated comment text"

# Edit issue comment
gh please issue comment edit 987654321 --body "Corrected information"
```

### Configuration

Initialize and manage `.please/config.yml`:

```bash
# Interactive setup (recommended for first time)
gh please init

# Non-interactive with defaults
gh please init --yes

# Overwrite existing config
gh please init --force
```

**Configuration sections:**
- `code_review`: Auto-review settings, severity thresholds
- `issue_workflow`: Triage, investigate, fix automation
- `code_workspace`: Workspace features
- `language`: Output language (ko/en - auto-detected)

## Output Formats

All list commands support LLM-friendly output formats:

```bash
# Human-readable (default)
gh please issue sub-issue list 123

# JSON for scripts and automation
gh please issue sub-issue list 123 --format json

# Markdown for documentation
gh please issue sub-issue list 123 --format markdown

# XML for LLM processing
gh please issue sub-issue list 123 --format xml
```

**Supported commands:**
- `issue sub-issue list`
- `issue dependency list`
- `issue comment list`
- `pr review thread list`

## Common Patterns

### Bug Fix Workflow

```bash
# 1. Triage new bug report
gh please ai triage 123

# 2. Investigate root cause
gh please ai investigate 123

# 3. Automated fix attempt
gh please ai fix 123
# Creates PR with fix + tests

# 4. Review the PR
gh please ai review 456
```

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

## Language Support

Commands detect system language automatically:

```bash
# Korean system (LANG=ko_KR.UTF-8)
gh please ai triage 123
# Output: 🤖 이슈 #123에 대한 PleaseAI 분류 트리거 중...

# English system (LANG=en_US.UTF-8)
gh please ai triage 123
# Output: 🤖 Triggering PleaseAI triage for issue #123...
```

**Language detection sources (in order):**
1. `LANG` environment variable
2. `LANGUAGE` environment variable
3. `LC_ALL` environment variable

Override temporarily:
```bash
LANG=en_US.UTF-8 gh please ai triage 123  # Force English
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
gh please ai triage 123 --repo owner/repo
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

3. **Node ID** - GraphQL global identifier
   - Format: Base64 string like `PRRT_kwDOABC123`
   - Use for: Review threads (GraphQL-only type)
   - Example: `gh please pr review thread resolve 456 --thread PRRT_kwDOABC123`

**When to use which:**
- Always use **Number** for issues and PRs
- Use **Database ID** for comments (from GitHub UI URL)
- Use **Node ID** for threads (from `thread list` command)

## Tips

- Use `--repo` flag to manage issues across multiple repositories
- Combine AI workflows sequentially (triage → investigate → fix)
- Use `issue develop` to create isolated worktrees for each issue
- Create sub-issues before starting work to track progress
- Reply to review comments as you address them (better UX for reviewers)
- Use `thread list` to get Node IDs before resolving specific threads
- Use `--format json` for automation and scripting
- Clean up worktrees with `issue cleanup` after PR is merged

---

**Extension Version:** 0.11.0
**Last Updated:** 2025-10-24
