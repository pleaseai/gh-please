# PleaseAI GitHub Extension - Claude Code Plugin

Claude Code plugin for the `gh-please` CLI extension, providing AI assistance for GitHub workflow automation.

## Overview

This plugin teaches Claude how to use the PleaseAI GitHub CLI extension, enabling intelligent command suggestions and guided workflows for:

- **AI Automation**: Trigger issue triage, investigation, fixes, and code reviews
- **Issue Management**: Create hierarchical issue structures with sub-issues and dependencies
- **PR Reviews**: Reply to review comments and manage discussion threads
- **Configuration**: Setup and optimize `.please/config.yml`

## Installation

### Company Internal Marketplace

```bash
# Install via Claude Code marketplace
claude plugin install pleaseai-github
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/pleaseai/gh-please.git
cd gh-please

# Create symlink to Claude plugins directory
ln -s $(pwd)/.claude-plugin ~/.claude/plugins/pleaseai-github

# Verify installation
ls -l ~/.claude/plugins/pleaseai-github
```

### Verification

Ask Claude:
```
How do I create a sub-issue with gh please?
```

Claude should recognize the skill and provide appropriate `gh please` command guidance.

## What's Included

### Single Unified Skill: "Using PleaseAI GitHub Extension"

**Trigger Keywords:**
- AI workflows: `gh please`, `/please`, `triage`, `investigate`, `fix`, `review`, `apply`
- Issue management: `create sub-issue`, `link sub-issue`, `add dependency`, `blocked-by`
- PR reviews: `review-reply`, `reply to review`, `resolve thread`
- Configuration: `init`, `configure PleaseAI`, `.please/config.yml`

**Content Structure:**
```
skills/using-pleaseai-github/
├── SKILL.md                    # Quick reference (286 lines)
└── reference/
    ├── AI-WORKFLOWS.md         # AI automation workflows (606 lines)
    ├── ISSUE-MANAGEMENT.md     # Sub-issues and dependencies (657 lines)
    ├── PR-REVIEWS.md           # Review workflows (708 lines)
    └── CONFIGURATION.md        # Configuration guide (586 lines)
```

## Usage Examples

### AI Workflows

**User:** "Trigger triage for issue #123"

**Claude:**
```bash
gh please ai triage 123
```

**User:** "이슈 #456에 대한 조사를 트리거해줘" (Korean)

**Claude:**
```bash
gh please ai investigate 456
```

### Issue Management

**User:** "Create a sub-issue for #100"

**Claude:**
```bash
gh please issue sub-issue create 100 --title "Your sub-issue title"
```

**User:** "Add dependency: #200 is blocked by #199"

**Claude:**
```bash
gh please issue dependency add 200 --blocked-by 199
```

### PR Reviews

**User:** "Reply to PR review comment #987654"

**Claude:**
```bash
gh please pr review-reply 987654 --body "Your reply"

# For multi-line replies:
gh please pr review-reply 987654 --body "$(cat <<'EOF'
Your detailed
multi-line
reply here
EOF
)"
```

**User:** "Resolve all threads in PR #456"

**Claude:**
```bash
gh please pr resolve 456 --all
```

### Configuration

**User:** "Setup PleaseAI configuration"

**Claude:**
```bash
# Interactive setup
gh please init

# Or with defaults
gh please init --yes
```

## Features

### Context-Aware Suggestions

Claude understands your intent and suggests appropriate commands:

- "Create a sub-issue" → `gh please issue sub-issue create`
- "Add a blocker" → `gh please issue dependency add --blocked-by`
- "Reply to review" → `gh please pr review-reply`

### Bilingual Support

Works with both Korean and English requests:

```
한글: "sub-issue 생성해줘"
English: "create a sub-issue"

Both trigger the same skill and provide appropriate guidance.
```

### Progressive Information

- **SKILL.md**: Quick reference for common commands
- **Reference docs**: Detailed guides with examples and best practices

Claude automatically loads reference docs when needed for complex scenarios.

## Development

### Testing Locally

1. Make changes to plugin files
2. Restart Claude or reload plugins
3. Test with sample requests:
   ```
   - "How do I use gh please?"
   - "Create a sub-issue for #123"
   - "Configure PleaseAI"
   ```

### Updating Content

When the `gh-please` extension adds new commands:

1. Update `SKILL.md` quick reference
2. Add details to appropriate `reference/*.md`
3. Update trigger keywords in frontmatter if needed
4. Test that Claude recognizes new commands

### File Limits

Maintain these limits for optimal performance:

- `SKILL.md`: ≤500 lines (currently 286)
- Each `reference/*.md`: 300-600 lines
  - `AI-WORKFLOWS.md`: 606 lines ✓
  - `ISSUE-MANAGEMENT.md`: 657 lines (slightly over but acceptable)
  - `PR-REVIEWS.md`: 708 lines (slightly over but acceptable)
  - `CONFIGURATION.md`: 586 lines ✓

## Contributing

### Adding Examples

Add real-world examples to reference docs:

```markdown
### Example: Your Scenario

**Context:** Describe the situation

**Commands:**
```bash
gh please <command>
```

**Result:** What happens
```

### Improving Descriptions

Make skill descriptions more discoverable by adding trigger keywords:

```yaml
description: ... Use when user mentions <keyword1>, <keyword2>, ...
```

### Testing Changes

```bash
# Check line counts
wc -l .claude-plugin/skills/using-pleaseai-github/SKILL.md
wc -l .claude-plugin/skills/using-pleaseai-github/reference/*.md

# Validate YAML frontmatter
head -n 10 .claude-plugin/skills/using-pleaseai-github/SKILL.md
```

## Troubleshooting

**Skill not loading:**
- Check symlink: `ls -l ~/.claude/plugins/pleaseai-github`
- Verify frontmatter syntax in SKILL.md
- Restart Claude

**Claude doesn't suggest commands:**
- Check trigger keywords in your request
- Try more explicit phrases: "using gh please" instead of just "please"
- Reference the extension directly: "gh-please extension"

**Wrong command suggested:**
- File an issue with the query and expected vs actual command
- We'll improve trigger keywords or examples

## Version

**Plugin Version:** 0.2.0 (matches `gh-please` extension version)

**Last Updated:** 2025-10-19

## Links

- [Extension Repository](https://github.com/pleaseai/gh-please)
- [Design Document](../docs/plugin.md)
- [Issue #12](https://github.com/pleaseai/gh-please/issues/12) - Plugin implementation tracking

## License

MIT (same as `gh-please` extension)

## Author

Minsu Lee (@amondnet)
