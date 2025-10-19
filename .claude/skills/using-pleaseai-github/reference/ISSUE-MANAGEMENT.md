# Issue Management

Comprehensive guide to managing GitHub issues with sub-issues and dependencies using the `gh-please` extension.

## Overview

The `gh-please` extension provides advanced issue management capabilities:

- **Sub-issues**: Create hierarchical issue structures (Epic → Feature → Task)
- **Dependencies**: Track blocked-by relationships between issues

These features use GitHub's GraphQL API to create rich issue hierarchies beyond standard GitHub functionality.

## Sub-issue Concepts

### What are Sub-issues?

Sub-issues are issues linked to a parent issue in a hierarchical relationship. They enable:

- Breaking large features into manageable tasks
- Tracking progress on complex projects
- Organizing related work
- Visualizing dependencies

### Hierarchy Pattern: Epic → Feature → Task

```
Epic #100: User Authentication System
├── Feature #101: OAuth Integration
│   ├── Task #110: Google OAuth provider
│   ├── Task #111: GitHub OAuth provider
│   └── Task #112: OAuth callback handler
├── Feature #102: Session Management
│   ├── Task #120: Session store implementation
│   ├── Task #121: Session middleware
│   └── Task #122: Session cleanup job
└── Feature #103: Password Reset
    ├── Task #130: Reset token generation
    ├── Task #131: Email notification
    └── Task #132: Reset form UI
```

### When to Use Sub-issues

**✅ Good use cases:**
- Large features spanning multiple PRs
- Epics requiring cross-team coordination
- Projects with clear hierarchical structure
- Tracking multi-step implementations

**❌ Avoid for:**
- Simple bug fixes (use labels instead)
- Issues with single PR
- Temporary or exploratory work

## Sub-issue Commands

### create

Create a new issue and automatically link it as a sub-issue.

**Syntax:**
```bash
gh please issue sub-issue create <parent-issue> --title <text> [--body <text>] [--repo owner/repo]
```

**Examples:**
```bash
# Basic creation
gh please issue sub-issue create 100 --title "Implement OAuth handler"

# With description
gh please issue sub-issue create 100 \
  --title "Add Google OAuth provider" \
  --body "Implement Google OAuth2 flow with PKCE"

# Cross-repository
gh please issue sub-issue create 100 \
  --title "Update API client" \
  --repo org/api-client
```

**Output:**
```
📝 Getting parent issue #100...
✓ Creating sub-issue...
✓ Sub-issue #101 created and linked to parent #100
   View: https://github.com/owner/repo/issues/101
```

**What happens:**
1. Creates new issue with title and body
2. Converts parent issue's Node ID (REST ID → GraphQL Node ID)
3. Converts child issue's Node ID
4. Links child to parent via GraphQL mutation
5. Returns new issue number

### add

Link an existing issue as a sub-issue to a parent.

**Syntax:**
```bash
gh please issue sub-issue add <parent-issue> <child-issue> [--repo owner/repo]
```

**Examples:**
```bash
# Link existing issue
gh please issue sub-issue add 100 101

# Cross-repository linking
gh please issue sub-issue add 100 101 --repo org/main
```

**Output:**
```
🔗 Getting Node IDs...
✓ Linking sub-issue #101 to parent #100...
✓ Sub-issue linked successfully
   Parent: https://github.com/owner/repo/issues/100
   Child: https://github.com/owner/repo/issues/101
```

**Use case:**
When you create issues first and organize them later:
```bash
# Create issues normally
gh issue create --title "OAuth handler" # → #101
gh issue create --title "Session store" # → #102
gh issue create --title "Password reset" # → #103

# Then organize under epic
gh please issue sub-issue add 100 101
gh please issue sub-issue add 100 102
gh please issue sub-issue add 100 103
```

### list

Display all sub-issues of a parent with their status.

**Syntax:**
```bash
gh please issue sub-issue list <parent-issue> [--repo owner/repo]
```

**Examples:**
```bash
# List sub-issues
gh please issue sub-issue list 100

# Cross-repository
gh please issue sub-issue list 100 --repo org/main
```

**Output:**
```
🔍 Fetching sub-issues for issue #100...
✓ Found 3 sub-issues:
🟢 #101: OAuth Integration
🟢 #102: Session Management
🔴 #103: Password Reset

View: https://github.com/owner/repo/issues/100
```

**Status indicators:**
- 🟢 Open issue
- 🔴 Closed issue

**Pro tip:** Use this to track epic progress:
```bash
# Weekly standup
gh please issue sub-issue list 100 | grep "🟢"  # Open tasks
gh please issue sub-issue list 100 | grep "🔴"  # Completed tasks
```

### remove

Unlink a sub-issue from its parent (issue itself remains).

**Syntax:**
```bash
gh please issue sub-issue remove <parent-issue> <child-issue> [--repo owner/repo]
```

**Examples:**
```bash
# Unlink sub-issue
gh please issue sub-issue remove 100 101

# Cross-repository
gh please issue sub-issue remove 100 101 --repo org/main
```

**Output:**
```
🔗 Getting Node IDs...
✓ Unlinking sub-issue #101 from parent #100...
✓ Sub-issue unlinked successfully
   Parent: https://github.com/owner/repo/issues/100
   Child: https://github.com/owner/repo/issues/101
```

**Important:** This only removes the relationship. Issue #101 still exists and remains open/closed.

## Dependency Management

### blocked-by Relationship

Dependencies track when one issue cannot proceed until another is resolved.

**Concept:**
```
Issue #200: Deploy to production
  ↑ blocked-by
Issue #199: Fix security vulnerabilities
```

Issue #200 cannot be completed until #199 is resolved.

### When to Use Dependencies

**✅ Good use cases:**
- Sequential work (API changes before frontend)
- Blocker bugs preventing features
- Infrastructure prerequisites
- Cross-team dependencies

**Example scenarios:**
- "Cannot add OAuth until backend API is ready" (#102 blocked-by #101)
- "Deploy blocked by failing tests" (#300 blocked-by #299)
- "UI update requires design approval" (#150 blocked-by #149)

## Dependency Commands

### add --blocked-by

Mark an issue as blocked by another issue.

**Syntax:**
```bash
gh please issue dependency add <issue> --blocked-by <blocker> [--repo owner/repo]
```

**Examples:**
```bash
# Simple dependency
gh please issue dependency add 200 --blocked-by 199

# Cross-repository blocker
gh please issue dependency add 200 --blocked-by 199 --repo org/main
```

**Output:**
```
🔗 Getting Node IDs...
✓ Adding dependency: #200 blocked by #199...
✓ Dependency added successfully
   Issue: https://github.com/owner/repo/issues/200
   Blocker: https://github.com/owner/repo/issues/199
```

**Real-world example:**
```bash
# Frontend deployment blocked by API changes
gh please issue dependency add 200 --blocked-by 199

# Now #200 shows: "Blocked by #199" in GitHub UI
```

### list

Show all issues blocking a given issue.

**Syntax:**
```bash
gh please issue dependency list <issue> [--repo owner/repo]
```

**Examples:**
```bash
# List blockers
gh please issue dependency list 200

# Cross-repository
gh please issue dependency list 200 --repo org/main
```

**Output:**
```
🔍 Fetching dependencies for issue #200...
✓ Issue #200 is blocked by:
   #199: Fix security vulnerabilities (OPEN)
   #198: Update dependencies (CLOSED)

View: https://github.com/owner/repo/issues/200
```

**Use case - Daily standup:**
```bash
# Check what's blocking your work
gh please issue dependency list 200

# If blocker is closed, remove dependency and proceed
```

### remove

Remove a blocker relationship.

**Syntax:**
```bash
gh please issue dependency remove <issue> <blocker> [--repo owner/repo]
```

**Examples:**
```bash
# Remove dependency
gh please issue dependency remove 200 199

# Cross-repository
gh please issue dependency remove 200 199 --repo org/main
```

**Output:**
```
🔗 Getting Node IDs...
✓ Removing dependency: #200 blocked by #199...
✓ Dependency removed successfully
   Issue: https://github.com/owner/repo/issues/200
   Former blocker: https://github.com/owner/repo/issues/199
```

**Workflow:**
```bash
# 1. Check if blocker is resolved
gh issue view 199
# Status: Closed

# 2. Remove dependency
gh please issue dependency remove 200 199

# 3. Proceed with work on #200
```

## GraphQL API Details

### Node ID Conversion

GitHub has two ID systems:
- **REST API**: Numeric IDs (e.g., `123`)
- **GraphQL API**: Node IDs (e.g., `I_kwDOABCD1234`)

**Conversion process:**
```bash
# User provides: 123
# Extension queries: GET /repos/owner/repo/issues/123
# Response contains: node_id: "I_kwDOABCD1234"
# Extension uses node_id for GraphQL mutation
```

**Why this matters:**
- GraphQL mutations require Node IDs
- REST endpoints return numeric IDs
- Extension handles conversion automatically

**Internal implementation (src/lib/github-graphql.ts:73-98):**
```typescript
async function getIssueNodeId(owner: string, repo: string, number: number): Promise<string> {
  const proc = Bun.spawn(['gh', 'api', `/repos/${owner}/${repo}/issues/${number}`])
  const output = await new Response(proc.stdout).text()
  const issue = JSON.parse(output)
  return issue.node_id
}
```

### GraphQL-Features Header

Sub-issue mutations require a special feature flag:

```http
GraphQL-Features: sub_issues
```

**Why:**
- Sub-issues are a beta GitHub feature
- Requires explicit opt-in via header
- Extension adds header automatically

**Internal implementation (src/lib/github-graphql.ts:23-42):**
```typescript
async function executeGraphQL(query: string, variables: Record<string, any>, features?: string[]) {
  const args = ['api', 'graphql']

  if (features && features.length > 0) {
    args.push('-H', `GraphQL-Features: ${features.join(', ')}`)
  }

  // ... execute query
}

// Usage:
await executeGraphQL(ADD_SUB_ISSUE_MUTATION, { parentId, childId }, ['sub_issues'])
```

### API Limitations

**Sub-issues:**
- ✅ Create new and link
- ✅ Link existing issues
- ✅ Unlink sub-issues
- ✅ List all sub-issues
- ❌ Cannot create multi-level nesting in single call
- ❌ Cannot bulk-link multiple issues at once

**Dependencies:**
- ✅ Add blocked-by relationships
- ✅ Remove dependencies
- ✅ List all blockers
- ❌ Cannot track "blocks" relationships (inverse)
- ❌ Cannot visualize full dependency graph via API

**Workarounds:**
```bash
# Multi-level nesting (Epic → Feature → Task)
# Do in sequence:
gh please issue sub-issue create 100 --title "OAuth" # → #101
gh please issue sub-issue create 101 --title "Google provider" # → #110

# Bulk linking
for issue in 101 102 103; do
  gh please issue sub-issue add 100 $issue
done
```

## Practical Examples

### Example 1: Organizing a Large Feature

**Scenario:** Implement user authentication system

**Step 1: Create Epic**
```bash
gh issue create --title "Epic: User Authentication System" # → #100
```

**Step 2: Break into Features**
```bash
gh please issue sub-issue create 100 --title "OAuth Integration" # → #101
gh please issue sub-issue create 100 --title "Session Management" # → #102
gh please issue sub-issue create 100 --title "Password Reset" # → #103
```

**Step 3: Break Features into Tasks**
```bash
# OAuth tasks
gh please issue sub-issue create 101 --title "Google OAuth provider" # → #110
gh please issue sub-issue create 101 --title "GitHub OAuth provider" # → #111
gh please issue sub-issue create 101 --title "OAuth callback handler" # → #112

# Session tasks
gh please issue sub-issue create 102 --title "Session store" # → #120
gh please issue sub-issue create 102 --title "Session middleware" # → #121

# Password reset tasks
gh please issue sub-issue create 103 --title "Reset token generation" # → #130
gh please issue sub-issue create 103 --title "Email notification" # → #131
```

**Step 4: Add Dependencies**
```bash
# Session depends on OAuth
gh please issue dependency add 102 --blocked-by 101

# Password reset needs session
gh please issue dependency add 103 --blocked-by 102
```

**Result:**
```
Epic #100: User Authentication
├── Feature #101: OAuth (no blockers)
│   ├── Task #110: Google provider
│   ├── Task #111: GitHub provider
│   └── Task #112: Callback handler
├── Feature #102: Session (blocked by #101)
│   ├── Task #120: Session store
│   └── Task #121: Middleware
└── Feature #103: Password Reset (blocked by #102)
    ├── Task #130: Token generation
    └── Task #131: Email notification
```

**Work order:**
1. Complete #101 (OAuth) first
2. Then #102 (Session)
3. Finally #103 (Password Reset)

### Example 2: Managing Release Dependencies

**Scenario:** Prepare v2.0 release

**Step 1: Create Release Issue**
```bash
gh issue create --title "Release v2.0" # → #300
```

**Step 2: Create Prerequisite Issues**
```bash
gh issue create --title "Fix security vulnerabilities" # → #301
gh issue create --title "Update dependencies" # → #302
gh issue create --title "Write migration guide" # → #303
```

**Step 3: Add Dependencies**
```bash
gh please issue dependency add 300 --blocked-by 301
gh please issue dependency add 300 --blocked-by 302
gh please issue dependency add 300 --blocked-by 303
```

**Step 4: Track Progress**
```bash
# Daily check
gh please issue dependency list 300
# Output:
# ✓ Issue #300 is blocked by:
#    #301: Fix security vulnerabilities (CLOSED) ✅
#    #302: Update dependencies (OPEN) ⏳
#    #303: Write migration guide (OPEN) ⏳
```

**Step 5: Remove Resolved Blockers**
```bash
gh please issue dependency remove 300 301  # Security fixed
```

**Step 6: Release When Unblocked**
```bash
gh please issue dependency list 300
# Output: No blockers found ✅

# Proceed with release
```

### Example 3: Cross-Team Coordination

**Scenario:** Frontend feature needs backend API

**Backend team (org/api repo):**
```bash
# Create API issue
gh issue create --title "Add user profile endpoint" --repo org/api # → #50
```

**Frontend team (org/web repo):**
```bash
# Create UI issue
gh issue create --title "User profile page" --repo org/web # → #100

# Block on backend API
gh please issue dependency add 100 --blocked-by 50 --repo org/web
```

**Result:**
- Frontend #100 clearly shows dependency on backend #50
- Teams coordinate via issue comments
- Frontend waits for backend completion

## Best Practices

### Sub-issues

**✅ Do:**
- Create 3-7 sub-issues per parent (manageable scope)
- Use consistent naming (Verb + Noun format)
- Close parent only when all sub-issues are closed
- Link PRs to sub-issues, not parent
- Update sub-issue status regularly

**❌ Don't:**
- Create >10 sub-issues (too granular)
- Mix abstraction levels (Epic + Tasks directly)
- Leave orphaned sub-issues
- Close parent while sub-issues are open

**Naming conventions:**
```
✅ Good:
- Epic: "User Authentication System"
- Feature: "OAuth Integration"
- Task: "Implement Google OAuth provider"

❌ Bad:
- Epic: "Auth stuff"
- Feature: "Do OAuth"
- Task: "Code"
```

### Dependencies

**✅ Do:**
- Add dependencies as soon as blockers are identified
- Document *why* in issue comments
- Remove dependencies promptly when resolved
- Track cross-team dependencies explicitly
- Use for technical blockers only

**❌ Don't:**
- Add dependencies for soft preferences
- Leave stale dependencies (blocker closed but dependency remains)
- Create circular dependencies (#A blocks #B blocks #A)
- Use for tracking related work (use sub-issues instead)

**Dependency vs Sub-issue:**
```
Use Sub-issue when:
- Parent-child relationship
- Part of same feature
- Hierarchical organization

Use Dependency when:
- Sequential work
- Technical blocker
- Cross-feature relationship
```

## Troubleshooting

**"GraphQL error: not found"**
- Issue number doesn't exist
- Wrong repository (use `--repo`)
- No permissions to access issue

**"GraphQL-Features required"**
- Extension automatically adds header
- If error persists, update extension: `gh extension upgrade pleaseai/gh-please`

**"Cannot link sub-issue"**
- Parent or child issue might be PR (only issues supported)
- Check issue numbers are correct
- Verify repository access

**"Circular dependency detected"**
- Remove one dependency: `gh please issue dependency remove A B`
- Redesign dependency graph

**"Sub-issue list is empty but I added some"**
- Verify with `gh issue view <parent>` (check labels/links)
- Re-add if missing: `gh please issue sub-issue add <parent> <child>`

---

**Last Updated:** 2025-10-19
**Related:** [AI-WORKFLOWS.md](./AI-WORKFLOWS.md), [PR-REVIEWS.md](./PR-REVIEWS.md)
