# TOON + JMESPath Migration Plan

This document outlines the plan to migrate all gh CLI passthrough commands to TOON format output with JMESPath query support.

## Table of Contents

- [Overview](#overview)
- [Goals](#goals)
- [Command Inventory](#command-inventory)
- [TOON Output Design](#toon-output-design)
- [JMESPath Integration](#jmespath-integration)
- [Implementation Phases](#implementation-phases)
- [Migration Strategy](#migration-strategy)
- [Success Criteria](#success-criteria)

## Overview

### Current State

gh-please currently supports passthrough with **opt-in** TOON format conversion:

```bash
# Default: gh CLI's original table output
gh please issue list

# Opt-in TOON format
gh please issue list --format toon
```

**Supported commands with field mappings:**
- `issue view` (21 fields)
- `pr view` (46 fields)
- `repo view` (67 fields)
- `release view` (18 fields)

### Future State

All gh CLI passthrough commands will:
1. **Default to TOON format** (token-efficient, LLM-friendly)
2. **Support JMESPath queries** for powerful filtering and transformation
3. **Maintain backward compatibility** via flags

```bash
# Default: TOON output
gh please issue list

# With JMESPath filtering
gh please issue list --query "[?state=='OPEN'].{number: number, title: title}"

# Fallback to original gh format if needed
gh please issue list --format table
```

## Goals

1. **Token Efficiency**: TOON format provides 58.9% token reduction vs. JSON
2. **LLM-Friendly**: Tab-delimited format is easier for LLMs to parse and process
3. **Powerful Filtering**: JMESPath enables complex queries without external tools
4. **Consistency**: All commands use the same output format and query syntax
5. **Backward Compatibility**: Existing scripts continue to work

## Command Inventory

### Core Commands (10)

| Command | Subcommands | --json Support | Migration Priority |
|---------|-------------|----------------|-------------------|
| `auth` | login, logout, refresh, status, setup-git, token | ❌ Limited | P3 |
| `browse` | N/A | ❌ No | P3 |
| `codespace` | code, cp, create, delete, edit, jupyter, list, logs, ports, rebuild, ssh, stop, view | ✅ Most | P2 |
| `gist` | clone, create, delete, edit, list, view | ✅ Yes | P2 |
| `issue` | close, comment, create, delete, edit, list, lock, pin, reopen, status, transfer, unpin, view | ✅ Yes | **P1** |
| `org` | list | ✅ Yes | P2 |
| `pr` | checkout, checks, close, comment, create, diff, edit, list, lock, merge, ready, reopen, review, status, unlock, view | ✅ Yes | **P1** |
| `project` | close, copy, create, delete, edit, field-create, field-delete, field-list, item-add, item-archive, item-create, item-delete, item-edit, item-list, link, list, mark-template, unlink, view | ✅ Most | P2 |
| `release` | create, delete, delete-asset, download, edit, list, upload, view | ✅ Yes | **P1** |
| `repo` | archive, clone, create, delete, deploy-key, edit, fork, list, rename, set-default, sync, unarchive, view | ✅ Most | **P1** |

### GitHub Actions Commands (3)

| Command | Subcommands | --json Support | Migration Priority |
|---------|-------------|----------------|-------------------|
| `cache` | delete, list | ✅ Yes | P2 |
| `run` | cancel, delete, download, list, rerun, view, watch | ✅ Yes | P2 |
| `workflow` | disable, enable, list, run, view | ✅ Yes | P2 |

### Additional Commands (14)

| Command | Purpose | --json Support | Migration Priority |
|---------|---------|----------------|-------------------|
| `agent-task` | Work with agent tasks (preview) | ✅ Yes | P3 |
| `alias` | Create command shortcuts | ✅ list only | P3 |
| `api` | Make authenticated GitHub API request | ✅ Yes (returns API response) | P2 |
| `attestation` | Work with artifact attestations | ✅ Yes | P3 |
| `completion` | Generate shell completion scripts | ❌ No | P3 |
| `config` | Manage configuration for gh | ✅ list only | P3 |
| `extension` | Manage gh extensions | ✅ Yes | P3 |
| `gpg-key` | Manage GPG keys | ✅ Yes | P3 |
| `label` | Manage labels | ✅ Yes | P2 |
| `preview` | Execute previews for gh features | Varies | P3 |
| `ruleset` | View info about repo rulesets | ✅ Yes | P2 |
| `search` | Search repos, issues, PRs | ✅ Yes | P2 |
| `secret` | Manage GitHub secrets | ✅ list only | P2 |
| `ssh-key` | Manage SSH keys | ✅ Yes | P3 |
| `status` | Print info about issues, PRs, notifications | ❌ Limited | P3 |
| `variable` | Manage GitHub Actions variables | ✅ list only | P2 |

### Summary

- **Total Commands**: 27
- **Full --json Support**: 18 commands (67%)
- **Partial --json Support**: 5 commands (19%)
- **No --json Support**: 4 commands (14%)

**Migration Ready**: 23 commands (85%)

## TOON Output Design

### Standard Format

All TOON outputs follow this structure:

```
field1	field2	field3	nested.field
value1	value2	value3	nested_value
```

**Rules:**
1. Header row with field names (tab-delimited)
2. Data rows with values (tab-delimited)
3. Nested objects flattened with dot notation (`author.login`, `milestone.title`)
4. Arrays represented as comma-separated values or separate rows (context-dependent)

### Field Selection Strategy

**Principle**: Include the most useful fields by default, allow customization via JMESPath.

**Default fields per command type:**

#### List Commands
- Minimal fields for quick overview
- Sortable identifiers (number, name)
- Status indicators (state, status)
- Timestamps (createdAt, updatedAt)

**Example** (`issue list`):
```
number	title	state	author.login	labels	updatedAt
123	Bug fix	OPEN	monalisa	bug,p1	2024-01-15T10:30:00Z
124	Feature	CLOSED	octocat	feature	2024-01-14T15:20:00Z
```

#### View Commands
- Comprehensive fields for detailed inspection
- All available metadata
- Related entities (assignees, reviewers, etc.)

**Example** (`issue view 123`):
```
number	title	state	author.login	body	labels	assignees	milestone.title	createdAt	updatedAt
123	Bug fix	OPEN	monalisa	Detailed description...	bug,p1	alice,bob	v1.0	2024-01-10T09:00:00Z	2024-01-15T10:30:00Z
```

### Nested Object Flattening

**Strategy**: Use dot notation for nested objects, preserve readability.

**Examples:**

```typescript
// Original JSON
{
  "number": 123,
  "author": {
    "login": "monalisa",
    "type": "User"
  },
  "milestone": {
    "title": "v1.0",
    "number": 5
  }
}

// TOON output
number	author.login	author.type	milestone.title	milestone.number
123	monalisa	User	v1.0	5
```

### Array Handling

**Two approaches based on context:**

1. **Comma-separated** (for simple lists):
```
number	title	labels
123	Bug fix	bug,p1,urgent
```

2. **Multiple rows** (for complex nested data):
```
pr.number	review.author	review.state
456	alice	APPROVED
456	bob	CHANGES_REQUESTED
```

**Decision criteria**: Use comma-separated for primitives, use multiple rows for objects.

## JMESPath Integration

### Query Flag Design

```bash
# Proposed flag: --query or -q
gh please issue list --query "[?state=='OPEN']"

# Combined with other flags
gh please pr list --state all --query "[?isDraft==\`true\`]"
```

### Execution Flow

```
1. Execute gh CLI command with --json flag
2. Parse JSON response
3. Apply JMESPath query (if provided)
4. Convert result to TOON format
5. Output to stdout
```

**Benefits:**
- Filter before TOON conversion (more efficient)
- Supports complex transformations
- Familiar syntax for users of jq, aws-cli, etc.

### Common Query Patterns

See [JMESPATH_PATTERNS.md](./JMESPATH_PATTERNS.md) for comprehensive examples.

**Quick examples:**

```bash
# Filter by state
gh please issue list --query "[?state=='OPEN']"

# Select specific fields
gh please pr list --query "[].{number: number, title: title, author: author.login}"

# Filter and project
gh please issue list --query "[?state=='OPEN'].{number: number, title: title}"

# Sort by created date
gh please pr list --query "sort_by([], &createdAt)"

# Count by state
gh please issue list --query "length([?state=='OPEN'])"
```

### Library Integration

**Recommended**: Use existing JMESPath library for TypeScript

```bash
bun add jmespath
```

**Implementation**:
```typescript
import jmespath from 'jmespath'

const jsonData = JSON.parse(stdout)
const filtered = query ? jmespath.search(jsonData, query) : jsonData
outputData(filtered, 'toon')
```

## Implementation Phases

### Phase 1: Core Commands (P1) - 4-6 weeks

**Focus**: High-frequency commands, maximum impact

**Commands:**
- `issue` (12 subcommands)
- `pr` (16 subcommands)
- `repo` (13 subcommands)
- `release` (8 subcommands)

**Deliverables:**
1. Update field mappings for all view commands
2. Add JMESPath query support
3. Implement TOON as default format
4. Add `--format table` fallback
5. Update documentation
6. Add tests for each command

**Success Metrics:**
- All P1 commands output TOON by default
- JMESPath queries work correctly
- 100% test coverage for new code
- Documentation updated

### Phase 2: GitHub Actions + Additional (P2) - 3-4 weeks

**Focus**: CI/CD automation, developer tools

**Commands:**
- GitHub Actions: `cache`, `run`, `workflow`
- Additional: `api`, `label`, `ruleset`, `search`, `secret`, `variable`, `gist`, `org`, `project`, `codespace`

**Deliverables:**
1. Extend TOON support to all P2 commands
2. Add specialized field mappings
3. Document query patterns for automation
4. Integration tests

### Phase 3: Remaining Commands (P3) - 2-3 weeks

**Focus**: Complete coverage, edge cases

**Commands:**
- `auth`, `browse`, `agent-task`, `alias`, `attestation`, `completion`, `config`, `extension`, `gpg-key`, `preview`, `ssh-key`, `status`

**Deliverables:**
1. Handle commands without --json support
2. Graceful fallback for incompatible commands
3. Complete documentation
4. Edge case testing

## Migration Strategy

### Backward Compatibility

**Approach**: Phased rollout with opt-out mechanism

**Version 1.0 (Current)**:
- Default: gh CLI original output
- Opt-in: `--format toon`

**Version 2.0 (Migration)**:
- Default: TOON output
- Opt-out: `--format table` or `--format original`
- Warning: Deprecation notice for users relying on table output

**Version 3.0 (Final)**:
- Default: TOON output
- Opt-out: `--format table` (maintained for compatibility)

### Configuration Support

Allow users to set default format in config:

```bash
# Set default format
gh please config set output.format toon

# Get current format
gh please config get output.format
```

### Breaking Changes

**Minimal impact strategy:**

1. **Progressive enhancement**: Add features without breaking existing usage
2. **Clear migration path**: Document how to maintain old behavior
3. **Deprecation warnings**: Give users time to adapt (1-2 releases)
4. **Feature flags**: Allow early adoption via config

### User Communication

1. **Release notes**: Clearly document changes in each version
2. **Migration guide**: Step-by-step guide for updating scripts
3. **Examples**: Before/after comparisons
4. **FAQ**: Common migration questions and answers

## Success Criteria

### Functional Requirements

- ✅ All P1 commands output TOON by default
- ✅ JMESPath queries work on all commands
- ✅ Field mappings complete for all view commands
- ✅ Backward compatibility via `--format table`
- ✅ Graceful error handling for unsupported commands

### Quality Requirements

- ✅ 100% test coverage for passthrough + JMESPath logic
- ✅ Performance: < 50ms overhead for query execution
- ✅ Documentation: All commands documented with examples
- ✅ Error messages: Clear, actionable, bilingual (EN/KO)

### User Experience Requirements

- ✅ Consistent output format across all commands
- ✅ Intuitive JMESPath query syntax
- ✅ Helpful error messages for invalid queries
- ✅ Migration guide with real-world examples

### Adoption Metrics

**Target (3 months post-launch):**
- 80% of users successfully using TOON format
- < 5% of users reporting issues
- 50% of users using JMESPath queries
- Positive feedback on LLM integration

## Timeline

```
Phase 1 (Weeks 1-6): Core Commands
  Week 1-2: Field mappings + JMESPath integration
  Week 3-4: TOON default implementation
  Week 5-6: Testing + Documentation

Phase 2 (Weeks 7-10): GitHub Actions + Additional
  Week 7-8: Implementation
  Week 9-10: Testing + Documentation

Phase 3 (Weeks 11-13): Remaining Commands
  Week 11: Implementation
  Week 12: Testing
  Week 13: Final documentation + Release

Total: 13 weeks (~3 months)
```

## Related Documentation

- [TOON_COMMAND_REFERENCE.md](./TOON_COMMAND_REFERENCE.md) - Complete command list with TOON examples
- [JMESPATH_PATTERNS.md](./JMESPATH_PATTERNS.md) - JMESPath query patterns and examples
- [GH_CLI_PASSTHROUGH.md](./GH_CLI_PASSTHROUGH.md) - Current passthrough implementation
- [ADR 0006](./adr/0006-toon-format.md) - TOON format design rationale
- [ADR 0007](./adr/0007-gh-cli-passthrough.md) - Passthrough design decisions
