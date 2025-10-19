# Configuration

Comprehensive guide to configuring PleaseAI with `.please/config.yml`.

## Overview

PleaseAI is configured via `.please/config.yml` in your repository root. This file controls:

- Code review automation settings
- Issue workflow automation (triage, investigate, fix)
- Code workspace features
- Language preferences

## init Command

### Interactive Setup

```bash
gh please init
```

Prompts for all configuration options with descriptions and defaults.

**Example session:**
```
🤖 Initializing PleaseAI configuration...

Code Review Settings:
  Enable automatic code review? (y/n) [y]: y
  Comment severity threshold (LOW/MEDIUM/HIGH) [MEDIUM]: MEDIUM
  Maximum review comments (-1 for unlimited) [-1]: 10
  Include draft PRs in auto-review? (y/n) [y]: n

Issue Workflow Settings:
  Enable automatic triage? (y/n) [y]: y
  Enable investigation workflow? (y/n) [y]: y
  Enable fix workflow? (y/n) [y]: y

Language:
  Preferred language (ko/en) [en]: en

✓ Configuration saved to .please/config.yml
```

### Non-interactive Setup

```bash
# Use defaults for all options
gh please init --yes
gh please init -y
```

**Generated config (defaults):**
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

### Force Overwrite

```bash
# Overwrite existing configuration
gh please init --force
gh please init -f
```

## Configuration Schema

### code_review Section

Controls automated code review behavior.

```yaml
code_review:
  disable: false                        # Master switch for code review
  comment_severity_threshold: MEDIUM    # Minimum severity to post: LOW | MEDIUM | HIGH
  max_review_comments: -1               # Max comments per PR (-1 = unlimited)
  pull_request_opened:                  # Triggers when PR is opened
    help: false                         # Post help comment
    summary: true                       # Post PR summary
    code_review: true                   # Run automatic review
    include_drafts: true                # Review draft PRs
```

**Severity Levels:**

- **LOW**: Style suggestions, minor improvements (e.g., variable naming, comments)
- **MEDIUM**: Potential bugs, maintainability issues (e.g., error handling, complexity)
- **HIGH**: Security vulnerabilities, critical bugs (e.g., SQL injection, XSS)

**Examples:**

```yaml
# Minimal noise - only critical issues
code_review:
  comment_severity_threshold: HIGH
  max_review_comments: 5

# Comprehensive review - all issues
code_review:
  comment_severity_threshold: LOW
  max_review_comments: -1

# Balanced approach - medium issues, limited comments
code_review:
  comment_severity_threshold: MEDIUM
  max_review_comments: 10
```

### issue_workflow Section

Controls issue automation workflows.

```yaml
issue_workflow:
  disable: false                    # Master switch for issue workflows
  triage:
    auto: true                      # Auto-triage new issues
    manual: true                    # Allow manual `/please triage`
    update_issue_type: true         # Update issue type label
  investigate:
    enabled: true                   # Enable investigation workflow
    org_members_only: true          # Restrict to org members
    auto_on_bug_label: false        # Auto-investigate when `bug` label added
  fix:
    enabled: true                   # Enable fix workflow
    org_members_only: true          # Restrict to org members
    require_investigation: false    # Require investigation before fix
    auto_create_pr: true            # Automatically create PR with fix
    auto_run_tests: true            # Run tests before creating PR
```

**Workflow Dependencies:**

```
triage → investigate → fix
  ↓          ↓          ↓
Labels   Analysis   PR + Tests
```

**Examples:**

```yaml
# Public repo - open triage, restricted fixes
issue_workflow:
  triage:
    auto: true                      # Auto-triage all new issues
    manual: true                    # Anyone can trigger
  investigate:
    org_members_only: false         # Allow community investigations
  fix:
    org_members_only: true          # Only maintainers can fix
    require_investigation: true     # Safety: require investigation first

# Private repo - full automation
issue_workflow:
  triage:
    auto: true
  investigate:
    auto_on_bug_label: true         # Auto-investigate bugs
  fix:
    require_investigation: false    # Trust the bot
    auto_create_pr: true
    auto_run_tests: true
```

### code_workspace Section

```yaml
code_workspace:
  enabled: true   # Enable workspace features
```

**Features:**
- Enhanced development environment
- Contextual code assistance
- Workspace-aware suggestions

### ignore_patterns

Exclude files/directories from analysis:

```yaml
ignore_patterns:
  - "vendor/**"           # Third-party code
  - "node_modules/**"     # Dependencies
  - "dist/**"             # Build artifacts
  - "**/*.min.js"         # Minified files
  - "test/fixtures/**"    # Test data
```

**Glob patterns supported:**
- `*` - Match any characters except `/`
- `**` - Match any characters including `/`
- `?` - Match single character
- `[abc]` - Match character set

### language

```yaml
language: ko    # Korean
language: en    # English (default)
```

Overrides system language detection for PleaseAI output.

## Team-specific Recommendations

### Small Teams (< 5 people)

**Focus:** High automation, trust the AI

```yaml
code_review:
  comment_severity_threshold: MEDIUM
  max_review_comments: -1
  pull_request_opened:
    code_review: true
    include_drafts: true

issue_workflow:
  triage:
    auto: true
  investigate:
    org_members_only: false    # Everyone can investigate
    auto_on_bug_label: true
  fix:
    org_members_only: false    # Everyone can trigger fixes
    require_investigation: false
    auto_create_pr: true
```

**Rationale:**
- Small team trusts automation
- Low noise tolerance
- Fast iteration

### Medium Teams (5-20 people)

**Focus:** Balanced automation, quality gates

```yaml
code_review:
  comment_severity_threshold: MEDIUM
  max_review_comments: 10          # Prevent overwhelming PRs
  pull_request_opened:
    code_review: true
    include_drafts: false          # Only review ready PRs

issue_workflow:
  triage:
    auto: true
  investigate:
    org_members_only: true         # Org members only
    auto_on_bug_label: false       # Manual trigger
  fix:
    org_members_only: true
    require_investigation: true    # Safety gate
    auto_create_pr: true
    auto_run_tests: true
```

**Rationale:**
- Balance automation with control
- Quality gates prevent mistakes
- Org-only for security

### Large Teams (> 20 people)

**Focus:** High signal, low noise, strict gates

```yaml
code_review:
  comment_severity_threshold: HIGH    # Only critical issues
  max_review_comments: 5              # Top 5 issues only
  pull_request_opened:
    code_review: true
    include_drafts: false

issue_workflow:
  triage:
    auto: true
    manual: true
  investigate:
    org_members_only: true
    auto_on_bug_label: false          # Manual only
  fix:
    org_members_only: true
    require_investigation: true       # Must investigate first
    auto_create_pr: false             # Manual PR creation
    auto_run_tests: true

ignore_patterns:
  - "vendor/**"
  - "**/generated/**"
  - "**/*.pb.go"                      # Generated protobufs
```

**Rationale:**
- Minimize noise (many PRs)
- Strict quality gates
- Manual control for fixes

### Open Source Projects

**Focus:** Community-friendly, maintainer control

```yaml
code_review:
  comment_severity_threshold: MEDIUM
  max_review_comments: 10
  pull_request_opened:
    code_review: true
    include_drafts: false             # Respect contributors' drafts

issue_workflow:
  triage:
    auto: true                        # Help maintainers categorize
    manual: true                      # Community can trigger
  investigate:
    org_members_only: false           # Community can investigate
    auto_on_bug_label: false
  fix:
    org_members_only: true            # Only maintainers can auto-fix
    require_investigation: true
    auto_create_pr: false             # Manual PR review

language: en                          # Default to English
```

**Rationale:**
- Welcoming to contributors
- Maintainers retain control
- Community can help triage

## Optimization Tips

### Reduce Noise

**Problem:** Too many low-value comments

**Solution:**
```yaml
code_review:
  comment_severity_threshold: HIGH   # Only show critical issues
  max_review_comments: 5             # Top 5 only
```

### Speed Up Reviews

**Problem:** Slow PR feedback

**Solution:**
```yaml
code_review:
  pull_request_opened:
    code_review: true                # Immediate review
    include_drafts: true             # Even for drafts
```

### Balance Automation vs Control

**Problem:** Too much automation

**Solution:**
```yaml
issue_workflow:
  fix:
    auto_create_pr: false            # Manual PR creation
    require_investigation: true      # Require human review first
```

### Ignore Generated Code

**Problem:** Reviews flag generated code

**Solution:**
```yaml
ignore_patterns:
  - "**/generated/**"
  - "**/*.pb.go"
  - "**/*.pb.ts"
  - "dist/**"
  - "build/**"
```

### Language-specific Settings

**Korean team:**
```yaml
language: ko
```

**Bilingual team:**
```yaml
language: en   # Default to English, team members can override locally
```

## Troubleshooting

### Config Not Loading

**Symptoms:** Changes to `.please/config.yml` not taking effect

**Solutions:**
1. Verify file location: Must be `.please/config.yml` in repository root
2. Check YAML syntax: Use validator (e.g., `yamllint .please/config.yml`)
3. Restart PleaseAI bot (if applicable)
4. Check file permissions: Must be readable

### YAML Syntax Errors

**Common mistakes:**

```yaml
# ❌ Wrong indentation
code_review:
comment_severity_threshold: MEDIUM   # Should be indented

# ✅ Correct
code_review:
  comment_severity_threshold: MEDIUM

# ❌ Wrong boolean format
code_review:
  disable: True   # Should be lowercase

# ✅ Correct
code_review:
  disable: true
```

### Permission Issues

**Symptoms:** Workflows not triggering despite configuration

**Check:**
```yaml
investigate:
  org_members_only: true   # Are you an org member?
fix:
  org_members_only: true   # Are you an org member?
```

**Solution:** Change to `false` or add yourself to GitHub organization

### No Auto-triage

**Symptoms:** New issues not automatically triaged

**Check:**
```yaml
issue_workflow:
  disable: false           # Must be false
  triage:
    auto: true             # Must be true
```

**Solution:** Verify both settings are correct

### Reviews Too Verbose

**Symptoms:** PRs have 50+ comments

**Solution:**
```yaml
code_review:
  comment_severity_threshold: HIGH   # Increase threshold
  max_review_comments: 10            # Limit total comments
```

## Configuration Examples

### Minimal Configuration

```yaml
code_review:
  disable: false
issue_workflow:
  disable: false
code_workspace:
  enabled: true
language: en
```

### Maximum Automation

```yaml
code_review:
  disable: false
  comment_severity_threshold: LOW
  max_review_comments: -1
  pull_request_opened:
    help: true
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
    org_members_only: false
    auto_on_bug_label: true
  fix:
    enabled: true
    org_members_only: false
    require_investigation: false
    auto_create_pr: true
    auto_run_tests: true

code_workspace:
  enabled: true

language: en
```

### Conservative Configuration

```yaml
code_review:
  disable: false
  comment_severity_threshold: HIGH
  max_review_comments: 3
  pull_request_opened:
    help: false
    summary: false
    code_review: false       # Manual review only
    include_drafts: false

issue_workflow:
  disable: false
  triage:
    auto: false              # Manual triage only
    manual: true
  investigate:
    enabled: true
    org_members_only: true
    auto_on_bug_label: false
  fix:
    enabled: false           # No automated fixes

code_workspace:
  enabled: false

language: en
```

---

**Last Updated:** 2025-10-19
**Related:** [AI-WORKFLOWS.md](./AI-WORKFLOWS.md), [ISSUE-MANAGEMENT.md](./ISSUE-MANAGEMENT.md)
