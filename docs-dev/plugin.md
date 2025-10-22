# Claude Code Plugin Design

## Overview

This document describes the Claude Code plugin for the `gh-please` extension. The plugin provides Claude with domain expertise on using the PleaseAI GitHub CLI extension, enabling AI-assisted workflow automation.

## Purpose

Enable Claude to:
- Suggest appropriate `gh please` commands based on user intent
- Guide users through PleaseAI workflows (triage, investigate, fix, review, apply)
- Help manage GitHub issues with sub-issues and dependencies
- Assist with PR review workflows (review-reply, resolve threads)
- Configure `.please/config.yml` settings

## Plugin Location

**Path:** `.claude-plugin/` (within gh-extension-please repository)

**Rationale:**
- Extension and plugin maintained by the same team (PleaseAI)
- Version synchronization (plugin updates with extension changes)
- Single PR review process
- Clear ownership and responsibility

## Directory Structure

```
.claude-plugin/
├── plugin.json                         # Plugin metadata
├── skills/
│   └── using-pleaseai-github/          # Single unified skill
│       ├── SKILL.md                    # Quick reference (≤500 lines)
│       └── reference/
│           ├── AI-WORKFLOWS.md         # triage, investigate, fix, review, apply (300-600 lines)
│           ├── ISSUE-MANAGEMENT.md     # sub-issue, dependency commands (300-600 lines)
│           ├── PR-REVIEWS.md           # review-reply, resolve (300-600 lines)
│           └── CONFIGURATION.md        # init, .please/config.yml (300-600 lines)
└── README.md                           # Plugin documentation
```

## Skill Specification

### Name
```
Using PleaseAI GitHub Extension
```

**Rationale:** Gerund form ("Using") is action-oriented per Claude Code best practices.

### Description

```yaml
description: Automate GitHub workflows with gh-please CLI extension - trigger PleaseAI automation (triage, investigate, fix, review, apply), manage sub-issues and dependencies, reply to PR reviews, and configure .please/config.yml. Use when user mentions gh please, /please, PleaseAI, create sub-issue, link sub-issue, add dependency, blocked-by, review-reply, or extension commands.
```

**Trigger Keywords:**
- **AI workflows:** `gh please`, `/please`, `triage`, `investigate`, `fix`, `review`, `apply`, `PleaseAI`
- **Issue management:** `sub-issue`, `create sub-issue`, `link sub-issue`, `dependency`, `blocked-by`, `add blocker`, `add dependency`
- **PR reviews:** `review-reply`, `reply to review`, `resolve thread`, `resolve conversation`
- **Configuration:** `init`, `.please/config.yml`, `configure PleaseAI`, `setup PleaseAI`

### Allowed Tools

```yaml
allowed-tools: Read, Bash, Grep, Glob, Edit, WebFetch
```

**Rationale:**
- `Read`: Read existing code and configuration
- `Bash`: Execute `gh please` commands
- `Grep`, `Glob`: Search codebase for context
- `Edit`: Modify `.please/config.yml`
- `WebFetch`: Reference PleaseAI documentation

## File Specifications

### 1. plugin.json

```json
{
  "name": "pleaseai-github",
  "version": "0.2.0",
  "description": "PleaseAI GitHub CLI extension을 위한 Claude Code 전문성 제공",
  "author": "Minsu Lee (@amondnet)",
  "repository": "pleaseai/gh-please",
  "skills": [
    "skills/using-pleaseai-github"
  ]
}
```

**Version:** Matches extension version (currently 0.2.0).

### 2. SKILL.md (≤500 lines)

**Frontmatter:**
```yaml
---
name: Using PleaseAI GitHub Extension
description: Automate GitHub workflows with gh-please CLI extension - trigger PleaseAI automation (triage, investigate, fix, review, apply), manage sub-issues and dependencies, reply to PR reviews, and configure .please/config.yml. Use when user mentions gh please, /please, PleaseAI, create sub-issue, link sub-issue, add dependency, blocked-by, review-reply, or extension commands.
allowed-tools: Read, Bash, Grep, Glob, Edit, WebFetch
---
```

**Content Structure:**

1. **Installation** (5-10 lines)
   - How to install the extension
   - Quick verification

2. **Quick Reference** (200-300 lines)
   - AI Workflows commands with one-line descriptions
   - Issue Management commands with examples
   - PR Review commands with examples
   - Configuration commands

3. **Common Patterns** (100-150 lines)
   - Workflow combinations (e.g., triage → investigate → fix)
   - Cross-repository operations (`--repo` option)
   - Language support (Korean/English auto-detection)

4. **Reference Links** (20-30 lines)
   - Links to detailed documentation in reference/

**Guidelines:**
- Code examples first, minimal prose
- One command per line with brief comment
- Use tables for command options
- Keep descriptions concise (1-2 sentences max)

### 3. reference/AI-WORKFLOWS.md (300-600 lines)

**Content:**

1. **Overview** (50 lines)
   - PleaseAI automation concept
   - `/please` comment trigger mechanism

2. **Individual Workflows** (40-60 lines each)
   - `triage`: Auto-categorize issues, add labels
   - `investigate`: Deep bug analysis, log inspection
   - `fix`: Automated fix attempt, code generation
   - `review`: Code review with security/quality checks
   - `apply`: Apply bot suggestions to PR

3. **Workflow Combinations** (100 lines)
   - Sequential workflows (triage → investigate → fix)
   - Parallel workflows (review multiple PRs)
   - Best practices for each workflow type

4. **Language Support** (50 lines)
   - System language detection (LANG, LANGUAGE, LC_ALL)
   - Korean vs English output examples
   - Customizing language preference

5. **Real-world Examples** (100 lines)
   - Complete bug fix workflow
   - Feature development with review
   - Emergency hotfix process

### 4. reference/ISSUE-MANAGEMENT.md (300-600 lines)

**Content:**

1. **Sub-issue Concepts** (80 lines)
   - Hierarchical issue structure
   - When to use sub-issues
   - Epic → Feature → Task pattern

2. **Sub-issue Commands** (120 lines)
   - `create`: Create new sub-issue with auto-linking
   - `add`: Link existing issue as sub-issue
   - `remove`: Unlink sub-issue from parent
   - `list`: Display all sub-issues with status
   - Each command: syntax, options, examples

3. **Dependency Management** (100 lines)
   - `blocked-by` relationship concept
   - Dependency graphs for complex projects
   - Commands: `add --blocked-by`, `remove`, `list`

4. **GraphQL API Details** (80 lines)
   - How Node ID conversion works
   - GraphQL-Features header requirement
   - API limitations and workarounds

5. **Practical Examples** (120 lines)
   - Organizing a large feature into sub-issues
   - Managing release dependencies
   - Tracking multi-team work

### 5. reference/PR-REVIEWS.md (300-600 lines)

**Content:**

1. **review-reply Command** (150 lines)
   - Finding comment ID (3 methods: GitHub UI, gh CLI, API)
   - Replying to top-level comments
   - Multi-line replies with heredoc
   - API limitation: nested replies not supported

2. **resolve Command** (100 lines)
   - Resolving individual threads (`--thread`)
   - Bulk resolution (`--all`)
   - When to resolve vs keep open
   - Thread ID lookup methods

3. **Review Best Practices** (100 lines)
   - Effective review response patterns
   - Managing multiple reviewers
   - Handling conflicting feedback
   - Review etiquette

4. **Practical Examples** (50 lines)
   - Responding to security concerns
   - Addressing performance feedback
   - Batch resolving after fixes

### 6. reference/CONFIGURATION.md (300-600 lines)

**Content:**

1. **init Command** (80 lines)
   - Interactive setup (`gh please init`)
   - Non-interactive mode (`--yes`)
   - Force overwrite (`--force`)

2. **Configuration Schema** (250 lines)
   - `code_review` section:
     - `comment_severity_threshold`: LOW/MEDIUM/HIGH
     - `max_review_comments`: Integer or -1 (unlimited)
     - `auto_review`: Boolean
     - `include_drafts`: Boolean
   - `issue_workflow` section:
     - `triage.auto`: Boolean
     - `investigate.enabled`: Boolean
     - `fix.auto_create_pr`: Boolean
   - `code_workspace` section
   - `language`: ko/en

3. **Team-specific Recommendations** (100 lines)
   - Small teams (< 5 people)
   - Medium teams (5-20 people)
   - Large teams (> 20 people)
   - Open source projects

4. **Optimization Tips** (70 lines)
   - Performance tuning
   - Reducing noise (severity thresholds)
   - Balancing automation vs manual control

5. **Troubleshooting** (100 lines)
   - Common configuration errors
   - YAML syntax issues
   - Permission problems

### 7. .claude-plugin/README.md

**Content:**

1. **Plugin Overview** (50 lines)
   - Purpose and features
   - Who should use it

2. **Installation** (80 lines)
   - Company internal marketplace: `claude plugin install pleaseai-github`
   - Local development: Symlink instructions
   - Verification steps

3. **Usage Examples** (100 lines)
   - "Create a sub-issue for #123"
   - "Trigger triage for issue #456"
   - "Reply to PR review comment"

4. **Contributing** (50 lines)
   - How to update the plugin
   - Testing changes locally
   - Submitting updates

## Best Practices Compliance

### ✅ Checklist

- [x] **Gerund form naming**: "Using PleaseAI GitHub Extension"
- [x] **Description includes functionality + triggers**: Commands listed + keyword triggers
- [x] **Progressive loading**: SKILL.md (≤500) → reference/ (300-600 each)
- [x] **Appropriate tool access**: Read, Bash, Grep, Glob, Edit, WebFetch
- [x] **Code examples first**: Minimal prose, command examples prioritized
- [x] **One-level-deep**: SKILL.md → reference/ only (no deeper nesting)
- [x] **Extension-specific**: Only `gh please` commands, no general `gh` CLI
- [x] **Trigger keywords include user actions**: "create sub-issue", "add dependency", "reply to review"

### Key Design Decisions

1. **Single unified skill** instead of 4 separate skills
   - Reduces fragmentation
   - User doesn't need to know which skill to invoke
   - Related workflows naturally grouped

2. **Extension-specific scope**
   - Only covers `gh please` commands
   - Excludes general GitHub workflows
   - Focuses on PleaseAI's unique features

3. **Plugin in extension repo**
   - Maintained by PleaseAI team
   - Versioned with extension
   - Simpler governance

## Implementation Guidelines

### Writing Style

- **Concise**: Every sentence must justify its existence
- **Example-driven**: Show command, then explain if needed
- **Practical**: Real-world scenarios over theoretical concepts
- **Bilingual**: Include Korean and English examples where relevant

### Code Example Format

```bash
# ✅ Good - Command with brief comment
gh please ai triage 123  # Auto-categorize and label issue

# ❌ Bad - Too verbose
# The triage command will automatically analyze the issue,
# determine its type, assign appropriate labels, and set priority
gh please ai triage 123
```

### Table Format

```markdown
| Command | Description | Example |
|---------|-------------|---------|
| `triage` | Auto-categorize issue | `gh please ai triage 123` |
```

### Cross-references

```markdown
See [AI-WORKFLOWS.md](./reference/AI-WORKFLOWS.md) for detailed workflow patterns.
```

## Testing

### Local Testing

1. Create symlink:
   ```bash
   ln -s /path/to/gh-extension-please/.claude-plugin ~/.claude/plugins/pleaseai-github
   ```

2. Verify plugin loaded:
   ```bash
   # Check Claude recognizes the skill
   # Ask: "How do I create a sub-issue with gh please?"
   ```

3. Test trigger keywords:
   - "Create a sub-issue for issue #123"
   - "Add a dependency to issue #200"
   - "Trigger triage for #456"
   - "Reply to PR review comment"

### Acceptance Criteria

- [ ] Plugin loads without errors
- [ ] Claude recognizes extension commands
- [ ] Claude suggests appropriate commands for user intents
- [ ] All trigger keywords work (sub-issue, dependency, review-reply, etc.)
- [ ] SKILL.md ≤500 lines
- [ ] Each reference/*.md 300-600 lines
- [ ] Korean and English examples present
- [ ] No general `gh` commands (only `gh please`)

## Maintenance

### When to Update

1. **Extension adds new command**
   - Update SKILL.md quick reference
   - Add detailed docs to appropriate reference/*.md
   - Update trigger keywords in description

2. **Extension changes command syntax**
   - Update all affected examples
   - Add migration note if breaking change

3. **Configuration schema changes**
   - Update CONFIGURATION.md
   - Update example `.please/config.yml`

4. **Best practice evolves**
   - Update workflow patterns
   - Add new real-world examples

### Version Synchronization

Plugin version should match extension version:
- Extension v0.2.0 → Plugin v0.2.0
- Extension v0.3.0 → Plugin v0.3.0

Update `plugin.json` version field when extension version bumps.

## References

- [Claude Code Skill Best Practices](../../engineering-standards/plugins/skill-dev/skills/creating-agent-skills/SKILL.md)
- [Progressive Loading Strategy](../../engineering-standards/plugins/skill-dev/skills/creating-agent-skills/reference/PROGRESSIVE-LOADING.md)
- [PleaseAI Extension README](../README.md)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Author:** Minsu Lee (@amondnet)
