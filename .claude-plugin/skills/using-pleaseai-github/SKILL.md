---
name: Using PleaseAI GitHub Extension
description: Automate GitHub workflows with gh-please CLI extension - trigger PleaseAI automation (triage, investigate, fix, review, apply), manage sub-issues and dependencies, reply to PR reviews, and configure .please/config.yml. Use when user mentions gh please, /please, PleaseAI, create sub-issue, link sub-issue, add dependency, blocked-by, review-reply, or extension commands.
allowed-tools: Read, Bash, Grep, Glob, Edit, WebFetch
---

# Using PleaseAI GitHub Extension

Quick reference for automating GitHub workflows with the `gh-please` CLI extension.

## Installation

```bash
# Install extension
gh extension install pleaseai/gh-please

# Verify installation
gh please --version  # Should show v0.2.0
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

Create hierarchical issue structures and dependencies:

#### Sub-issues

| Command | Description | Example |
|---------|-------------|---------|
| `issue sub-issue create <parent>` | Create new sub-issue | `gh please issue sub-issue create 100 --title "Fix auth"` |
| `issue sub-issue add <parent> <child>` | Link existing issue | `gh please issue sub-issue add 100 101` |
| `issue sub-issue list <parent>` | Show all sub-issues | `gh please issue sub-issue list 100` |
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
| `issue dependency list <issue>` | Show blocking issues | `gh please issue dependency list 200` |
| `issue dependency remove <issue> <blocker>` | Remove dependency | `gh please issue dependency remove 200 199` |

```bash
# Issue #200 is blocked by #199
gh please issue dependency add 200 --blocked-by 199

# View all blockers
gh please issue dependency list 200
# Output: Issue #200 is blocked by: #199
```

### PR Reviews

Respond to review comments and manage discussion threads:

#### Reply to Comments

```bash
# Reply to review comment
gh please pr review-reply 987654 -b "Fixed in latest commit"

# Multi-line reply
gh please pr review-reply 987654 --body "$(cat <<'EOF'
Good catch! I've updated the implementation:

1. Added error handling
2. Included unit tests
3. Updated documentation

Let me know if you have other concerns.
EOF
)"

# From stdin
echo "Thanks for the review!" | gh please pr review-reply 987654
```

**Finding comment ID:**
- GitHub UI: URL shows `#discussion_r987654` → use `987654`
- gh CLI: `gh pr view 123 --json comments`
- API: `gh api /repos/OWNER/REPO/pulls/123/comments`

**Limitation:** Only top-level review comments supported (API restriction).

#### Resolve Threads

```bash
# Resolve all threads
gh please pr resolve 456 --all

# Resolve specific thread
gh please pr resolve 456 --thread MDEyOlB1bGxSZXF1ZXN0UmV2aWV3VGhyZWFk...

# Cross-repo
gh please pr resolve 456 --all --repo owner/repo
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
# 1. View PR comments
gh pr view 456

# 2. Reply to specific concerns
gh please pr review-reply 111 -b "Updated error handling"
gh please pr review-reply 222 -b "Added tests for edge cases"

# 3. After addressing all feedback
gh please pr resolve 456 --all

# 4. Request re-review
gh pr ready 456
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

- **[AI-WORKFLOWS.md](./reference/AI-WORKFLOWS.md)** - Workflow combinations, `/please` triggers, real-world examples
- **[ISSUE-MANAGEMENT.md](./reference/ISSUE-MANAGEMENT.md)** - Epic → Feature → Task patterns, GraphQL API details
- **[PR-REVIEWS.md](./reference/PR-REVIEWS.md)** - Comment ID discovery, review best practices
- **[CONFIGURATION.md](./reference/CONFIGURATION.MD)** - Complete schema, team-specific settings, optimization tips

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

**"comment not found" (review-reply)**
```bash
# Wrong comment ID - verify with:
gh api /repos/OWNER/REPO/pulls/PR/comments | jq '.[] | {id, body}'

# Or from GitHub UI:
# URL: github.com/.../pull/123#discussion_r987654
# Use: 987654 (not the full discussion_r prefix)
```

## Tips

- Use `--repo` flag to manage issues across multiple repositories
- Combine AI workflows sequentially (triage → investigate → fix)
- Create sub-issues before starting work to track progress
- Reply to review comments as you address them (better UX for reviewers)
- Use `--all` flag on `resolve` after comprehensive updates

---

**Extension Version:** 0.2.0
**Plugin Version:** 0.2.0
**Last Updated:** 2025-10-19
