# JMESPath Query Patterns

Comprehensive guide to JMESPath query patterns for gh-please TOON format output.

## Table of Contents

- [Introduction](#introduction)
- [Basic Syntax](#basic-syntax)
- [Common Patterns](#common-patterns)
  - [Filtering](#filtering)
  - [Projection](#projection)
  - [Sorting](#sorting)
  - [Transformation](#transformation)
  - [Aggregation](#aggregation)
- [Real-World Examples](#real-world-examples)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Introduction

JMESPath is a query language for JSON that allows you to:
- Filter data based on conditions
- Select specific fields (projection)
- Transform data structure
- Sort and aggregate results

### Why JMESPath?

**Advantages over jq:**
- Simpler, more intuitive syntax
- Better for common filtering tasks
- Familiar to AWS CLI users
- Easier to learn for beginners

**Example comparison:**

```bash
# jq syntax
gh please issue list --format json | jq '.[] | select(.state == "OPEN") | {number, title}'

# JMESPath syntax (built-in)
gh please issue list --query "[?state=='OPEN'].{number: number, title: title}"
```

### Integration with gh-please

```bash
# General syntax
gh please <command> [flags] --query '<jmespath-expression>'

# Query is applied AFTER gh CLI execution, BEFORE TOON conversion
# Execution flow: gh → JSON → JMESPath filter → TOON format → output
```

## Basic Syntax

### Accessing Fields

```bash
# Single field
--query "number"

# Nested field
--query "author.login"

# Array index
--query "items[0]"

# All array elements
--query "items[*]" or --query "items[]"
```

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `.` | Field accessor | `author.login` |
| `[]` | Array accessor | `items[0]`, `items[]` |
| `[?]` | Filter | `[?state=='OPEN']` |
| `{}` | Multi-select hash | `{number: number, title: title}` |
| `*` | Wildcard | `items[*]` |
| `&` | Expression reference | `sort_by([], &createdAt)` |
| <code>\|</code> | Pipe | `items[] \| [0]` |

### Comparison Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equal | `state=='OPEN'` |
| `!=` | Not equal | `state!='CLOSED'` |
| `>` | Greater than | `stargazerCount > \`100\`` |
| `>=` | Greater or equal | `createdAt >= '2024-01-01'` |
| `<` | Less than | `number < \`50\`` |
| `<=` | Less or equal | `updatedAt <= '2024-01-31'` |

**Note:** Backticks (\`) are required for numeric literals in comparisons.

### Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `&&` | AND | `state=='OPEN' && isDraft==\`false\`` |
| <code>\|\|</code> | OR | <code>state=='OPEN' \|\| state=='MERGED'</code> |
| `!` | NOT | `!isDraft` |

### Functions

| Function | Description | Example |
|----------|-------------|---------|
| `contains()` | Check if string/array contains value | `contains(labels, 'bug')` |
| `starts_with()` | Check if string starts with prefix | `starts_with(title, 'feat:')` |
| `ends_with()` | Check if string ends with suffix | `ends_with(name, '.md')` |
| `length()` | Get length of array/string | `length(items)` |
| `sort_by()` | Sort array by expression | `sort_by([], &updatedAt)` |
| `reverse()` | Reverse array order | `reverse(sort_by([], &number))` |
| `max_by()` | Get max element by expression | `max_by([], &stargazerCount)` |
| `min_by()` | Get min element by expression | `min_by([], &createdAt)` |
| `to_number()` | Convert to number | `to_number(number)` |
| `to_string()` | Convert to string | `to_string(number)` |

## Common Patterns

### Filtering

#### Basic Filtering

```bash
# Issues with state OPEN
gh please issue list --query "[?state=='OPEN']"

# PRs by specific author
gh please pr list --query "[?author.login=='monalisa']"

# Repos with >100 stars
gh please repo list --query "[?stargazerCount > \`100\`]"
```

#### Multiple Conditions (AND)

```bash
# Open issues with bug label
gh please issue list --query "[?state=='OPEN' && contains(labels, 'bug')]"

# Approved PRs that are not drafts
gh please pr list --query "[?reviewDecision=='APPROVED' && isDraft==\`false\`]"

# Public TypeScript repos with >50 stars
gh please repo list --query "[?visibility=='PUBLIC' && primaryLanguage.name=='TypeScript' && stargazerCount > \`50\`]"
```

#### Multiple Conditions (OR)

```bash
# Issues that are open or pinned
gh please issue list --query "[?state=='OPEN' || isPinned==\`true\`]"

# PRs that are merged or approved
gh please pr list --query "[?state=='MERGED' || reviewDecision=='APPROVED']"
```

#### Negation

```bash
# Non-draft PRs
gh please pr list --query "[?isDraft==\`false\`]"
# or
gh please pr list --query "[?!isDraft]"

# Issues not closed
gh please issue list --query "[?state!='CLOSED']"
```

#### String Matching

```bash
# Issues with title starting with "feat:"
gh please issue list --query "[?starts_with(title, 'feat:')]"

# Files ending with .ts
gh please api /repos/owner/repo/contents --query "[?ends_with(name, '.ts')]"

# PRs containing "auth" in title
gh please pr list --query "[?contains(title, 'auth')]"
```

#### Array Contains

```bash
# Issues with 'bug' label
gh please issue list --query "[?contains(labels, 'bug')]"

# Issues assigned to alice or bob
gh please issue list --query "[?contains(assignees, 'alice') || contains(assignees, 'bob')]"
```

#### Date Filtering

```bash
# Issues updated after 2024-01-01
gh please issue list --query "[?updatedAt > '2024-01-01']"

# PRs created in January 2024
gh please pr list --query "[?starts_with(createdAt, '2024-01')]"

# Releases published in 2024
gh please release list --query "[?starts_with(publishedAt, '2024')]"
```

### Projection

#### Select Specific Fields

```bash
# Only number and title
gh please issue list --query "[].{number: number, title: title}"

# TOON Output:
# number	title
# 123	Fix bug
# 124	Add feature
```

#### Rename Fields

```bash
# Rename fields for clarity
gh please issue list --query "[].{id: number, name: title, status: state}"

# TOON Output:
# id	name	status
# 123	Fix bug	OPEN
# 124	Add feature	CLOSED
```

#### Nested Field Selection

```bash
# Extract nested fields
gh please pr list --query "[].{number: number, author: author.login, branch: headRefName}"

# TOON Output:
# number	author	branch
# 456	monalisa	feat-auth
# 457	octocat	fix-typo
```

#### Computed Fields

```bash
# Add computed fields
gh please repo list --query "[].{name: nameWithOwner, score: stargazerCount, forks: forkCount, ratio: stargazerCount}"

# Note: JMESPath doesn't support arithmetic, use projection for now
```

#### Filter + Project

```bash
# Combine filtering and projection
gh please issue list --query "[?state=='OPEN'].{number: number, title: title, author: author.login}"

# Only open issues, only specific fields
```

### Sorting

#### Sort Ascending

```bash
# Sort by number (ascending)
gh please issue list --query "sort_by([], &number)"

# Sort by updated date (oldest first)
gh please pr list --query "sort_by([], &updatedAt)"

# Sort by star count (ascending)
gh please repo list --query "sort_by([], &stargazerCount)"
```

#### Sort Descending

```bash
# Sort by number (descending)
gh please issue list --query "reverse(sort_by([], &number))"

# Sort by updated date (newest first)
gh please pr list --query "reverse(sort_by([], &updatedAt))"

# Sort by star count (descending)
gh please repo list --query "reverse(sort_by([], &stargazerCount))"
```

#### Sort with Filtering

```bash
# Open issues sorted by updated date (newest first)
gh please issue list --query "reverse(sort_by([?state=='OPEN'], &updatedAt))"

# Approved PRs sorted by number
gh please pr list --query "sort_by([?reviewDecision=='APPROVED'], &number)"
```

### Transformation

#### Flatten Nested Arrays

```bash
# Get all file names from PR
gh please pr view 123 --query "files[].filename"

# TOON Output (one per line):
# src/index.ts
# src/utils.ts
# test/index.test.ts
```

#### Limit Results

```bash
# First 5 issues
gh please issue list --query "[][:5]"

# Last 3 releases
gh please release list --query "[][-3:]"

# Issues 10-20
gh please issue list --query "[][10:20]"
```

#### First/Last Element

```bash
# Latest release
gh please release list --query "[0]"

# Oldest issue
gh please issue list --query "sort_by([], &createdAt) | [0]"

# Most starred repo
gh please repo list --query "max_by([], &stargazerCount)"
```

### Aggregation

#### Count

```bash
# Count open issues
gh please issue list --query "length([?state=='OPEN'])"

# Count approved PRs
gh please pr list --query "length([?reviewDecision=='APPROVED'])"
```

#### Max/Min

```bash
# Issue with highest number
gh please issue list --query "max_by([], &number)"

# Oldest PR (by createdAt)
gh please pr list --query "min_by([], &createdAt)"

# Most starred repo
gh please repo list --query "max_by([], &stargazerCount)"
```

#### Group By (Manual)

JMESPath doesn't have native group_by, but you can filter multiple times:

```bash
# Count issues by state (run multiple queries)
gh please issue list --query "length([?state=='OPEN'])"  # Open count
gh please issue list --query "length([?state=='CLOSED'])"  # Closed count

# Or use external tools for grouping
gh please issue list --format json | jq 'group_by(.state) | map({state: .[0].state, count: length})'
```

## Real-World Examples

### Issue Management

#### Find Stale Issues

```bash
# Issues not updated in 30 days
gh please issue list --query "[?updatedAt < '2023-12-01']"

# Open issues with no assignees
gh please issue list --query "[?state=='OPEN' && (!assignees || length(assignees) == \`0\`)]"
```

#### Priority Triage

```bash
# P1 bugs
gh please issue list --query "[?contains(labels, 'p1') && contains(labels, 'bug')]"

# Critical issues without milestone
gh please issue list --query "[?contains(labels, 'critical') && !milestone]"

# Open issues by milestone
gh please issue list --query "[?state=='OPEN'].{number: number, title: title, milestone: milestone.title}"
```

### Pull Request Review

#### Find PRs Needing Review

```bash
# PRs without review decision
gh please pr list --query "[?state=='OPEN' && !reviewDecision]"

# PRs with changes requested
gh please pr list --query "[?reviewDecision=='CHANGES_REQUESTED']"

# Draft PRs ready for review
gh please pr list --query "[?isDraft==\`false\` && state=='OPEN']"
```

#### CI/CD Status

```bash
# PRs with passing checks
gh please pr list --query "[?statusCheckRollup.state=='SUCCESS']"

# PRs with failed checks
gh please pr list --query "[?statusCheckRollup.state=='FAILURE']"
```

### Repository Insights

#### Popular Repos

```bash
# Top 10 repos by stars
gh please repo list --query "reverse(sort_by([], &stargazerCount))[:10]"

# Recently active repos
gh please repo list --query "reverse(sort_by([], &pushedAt))[:10]"

# TypeScript repos sorted by stars
gh please repo list --query "reverse(sort_by([?primaryLanguage.name=='TypeScript'], &stargazerCount))"
```

#### Repository Health

```bash
# Repos with issues enabled
gh please repo list --query "[?hasIssuesEnabled==\`true\`]"

# Archived repos
gh please repo list --query "[?isArchived==\`true\`]"

# Forks only
gh please repo list --query "[?isFork==\`true\`]"
```

### Release Management

#### Version Tracking

```bash
# Latest stable release (no pre-releases)
gh please release list --query "[?isPrerelease==\`false\` && isDraft==\`false\`] | [0]"

# All v1.x releases
gh please release list --query "[?starts_with(tagName, 'v1.')]"

# Releases in 2024
gh please release list --query "[?starts_with(publishedAt, '2024')]"
```

### GitHub Actions

#### Workflow Run Analysis

```bash
# Failed runs on main branch
gh please run list --query "[?conclusion=='failure' && headBranch=='main']"

# Runs in progress
gh please run list --query "[?status=='in_progress']"

# Successful runs sorted by duration
gh please run list --query "reverse(sort_by([?conclusion=='success'], &createdAt))"
```

#### Workflow Debugging

```bash
# Recent failures
gh please run list --query "reverse(sort_by([?conclusion=='failure'], &createdAt))[:10]"

# Runs triggered by pull_request
gh please run list --query "[?event=='pull_request']"
```

## Best Practices

### 1. Start Simple

Begin with basic filters, then add complexity:

```bash
# Step 1: Basic filter
--query "[?state=='OPEN']"

# Step 2: Add more conditions
--query "[?state=='OPEN' && contains(labels, 'bug')]"

# Step 3: Add projection
--query "[?state=='OPEN' && contains(labels, 'bug')].{number: number, title: title}"

# Step 4: Add sorting
--query "reverse(sort_by([?state=='OPEN' && contains(labels, 'bug')], &updatedAt)).{number: number, title: title}"
```

### 2. Use Projection Early

Filter first, then project to reduce data:

```bash
# ✅ Good: Filter then project
--query "[?state=='OPEN'].{number: number, title: title}"

# ❌ Avoid: Project then filter (doesn't work)
--query "{number: number, title: title} | [?state=='OPEN']"
```

### 3. Quote Properly

Use single quotes for the query, double quotes inside:

```bash
# ✅ Correct
--query "[?state=='OPEN']"

# ❌ Wrong
--query "[?state="OPEN"]"
```

### 4. Backticks for Numbers

Always use backticks for numeric literals:

```bash
# ✅ Correct
--query "[?number > \`100\`]"

# ❌ Wrong
--query "[?number > 100]"
```

### 5. Test Incrementally

Build complex queries step by step:

```bash
# Test filter first
gh please issue list --query "[?state=='OPEN']"

# Add projection
gh please issue list --query "[?state=='OPEN'].{number: number, title: title}"

# Add sorting
gh please issue list --query "reverse(sort_by([?state=='OPEN'], &number)).{number: number, title: title}"
```

### 6. Combine with Shell Tools

For complex aggregations, use shell tools:

```bash
# Count by state
gh please issue list --format toon | awk -F'\t' 'NR>1 {count[$3]++} END {for (s in count) print s, count[s]}'

# Or use JSON + jq for complex grouping
gh please issue list --format json | jq 'group_by(.state) | map({state: .[0].state, count: length})'
```

## Troubleshooting

### Common Errors

#### Syntax Error: Invalid Expression

```bash
# Error
--query "[?state=OPEN]"
# Fix: Add quotes
--query "[?state=='OPEN']"
```

#### Syntax Error: Unexpected Token

```bash
# Error
--query "[?number > 100]"
# Fix: Add backticks for numbers
--query "[?number > \`100\`]"
```

#### Empty Result

```bash
# Possible causes:
# 1. No data matches filter
# 2. Wrong field name (case-sensitive)
# 3. Wrong comparison operator

# Debug: Remove filters one by one
--query "[]"  # All data
--query "[?state=='OPEN']"  # Add filter
--query "[?state=='OPEN' && isDraft==\`false\`]"  # Add more filters
```

#### Field Not Found

```bash
# Error: Field doesn't exist
--query "[?nonexistent=='value']"

# Fix: Check available fields
gh please issue list --format json | jq '.[0] | keys'
```

### Performance Tips

#### 1. Filter Before Sorting

```bash
# ✅ Efficient
--query "sort_by([?state=='OPEN'], &number)"

# ❌ Less efficient
--query "sort_by([], &number) | [?state=='OPEN']"
```

#### 2. Limit Result Size

```bash
# ✅ Good: Limit after filtering
--query "[?state=='OPEN'][:10]"

# Use gh CLI --limit flag when possible
gh please issue list --limit 100 --query "[?state=='OPEN']"
```

#### 3. Use Projection to Reduce Data

```bash
# ✅ Good: Only select needed fields
--query "[].{number: number, title: title}"

# ❌ Avoid: Returning all fields unnecessarily
--query "[]"
```

## Advanced Patterns

### Conditional Selection

```bash
# Select different fields based on condition
gh please pr list --query "[].{number: number, status: (isDraft && 'DRAFT') || (reviewDecision || 'PENDING')}"
```

### Multi-Level Filtering

```bash
# Filter nested arrays
gh please pr view 123 --query "files[?starts_with(path, 'src/')].path"
```

### Combining Filters with Shell

```bash
# Filter with JMESPath, process with awk
gh please issue list --query "[?state=='OPEN'].{number: number, title: title}" | awk -F'\t' 'NR>1 {print "#" $1 ": " $2}'
```

## Related Documentation

- [TOON_JMESPATH_MIGRATION.md](./TOON_JMESPATH_MIGRATION.md) - Migration plan
- [TOON_COMMAND_REFERENCE.md](./TOON_COMMAND_REFERENCE.md) - Command reference
- [JMESPath Specification](https://jmespath.org/specification.html) - Official spec
- [JMESPath Tutorial](https://jmespath.org/tutorial.html) - Interactive tutorial
- [JMESPath Examples](https://jmespath.org/examples.html) - More examples
