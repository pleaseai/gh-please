# Command Expansion Implementation Plan

## Overview

This document outlines the detailed implementation plan for expanding gh-please extension with new command groups (`ai`, `issue`, `pr`) and features.

See [ADR 001](../adr/001-command-structure.md) for architectural decisions.

## Final Command Structure

```bash
# PleaseAI triggers (ai group) - Creates GitHub comments to trigger bot
gh please ai triage <issue-number>         # → /please triage
gh please ai investigate <issue-number>    # → /please investigate
gh please ai fix <issue-number>            # → /please fix
gh please ai review <pr-number>            # → /please review
gh please ai apply <pr-number>             # → /please apply

# Issue management (issue group) - Direct GraphQL/REST API calls
gh please issue sub-issue create <parent> --title "..." [--body "..."]
gh please issue sub-issue add <parent> <child>
gh please issue sub-issue list <parent>
gh please issue dependency add <issue> --blocked-by <blocker>
gh please issue dependency remove <issue> <blocker>
gh please issue dependency list <issue>

# PR management (pr group) - Direct GraphQL/REST API calls
gh please pr review-reply <comment-id> -b "text"   # Review comment reply
gh please pr resolve <pr-number> [--thread <id> | --all]  # Resolve threads

# Configuration
gh please init [-f] [-y]

# Deprecated (backward compatibility)
gh please review-reply <comment-id> -b "text"  # → redirects to pr review-reply
```

## Directory Structure

```
src/
├── commands/
│   ├── ai/                    # PleaseAI trigger commands
│   │   ├── triage.ts
│   │   ├── investigate.ts
│   │   ├── fix.ts
│   │   ├── review.ts
│   │   ├── apply.ts
│   │   └── index.ts          # ai group command registration
│   ├── issue/                 # Issue management commands
│   │   ├── sub-issue.ts      # create, add, list subcommands
│   │   ├── dependency.ts     # add, remove, list subcommands
│   │   └── index.ts          # issue group command registration
│   ├── pr/                    # PR management commands
│   │   ├── review-reply.ts   # moved from commands/
│   │   ├── resolve.ts
│   │   └── index.ts          # pr group command registration
│   └── init.ts               # existing, unchanged
├── lib/
│   ├── github-api.ts         # existing + comment creation
│   ├── github-graphql.ts     # NEW: GraphQL client
│   ├── github-rest.ts        # NEW: REST API extensions
│   ├── please-trigger.ts     # NEW: PleaseAI trigger helpers
│   ├── validation.ts         # existing, may extend
│   └── i18n.ts              # existing
├── config/
│   └── schema.ts            # existing, may extend
├── types.ts                 # existing + new types
└── index.ts                 # command registration

test/
├── commands/
│   ├── ai/
│   │   ├── triage.test.ts
│   │   ├── investigate.test.ts
│   │   ├── fix.test.ts
│   │   ├── review.test.ts
│   │   └── apply.test.ts
│   ├── issue/
│   │   ├── sub-issue.test.ts
│   │   └── dependency.test.ts
│   └── pr/
│       ├── review-reply.test.ts  # existing, moved
│       └── resolve.test.ts
└── lib/
    ├── github-graphql.test.ts
    ├── github-rest.test.ts
    └── please-trigger.test.ts
```

## Implementation Phases

### Phase 1: Infrastructure (Foundation)

**Goal**: Build common libraries for GraphQL, REST API, and PleaseAI triggers.

#### Files to Create/Modify

**`src/lib/github-graphql.ts`** (NEW)

```typescript
/**
 * Execute a GraphQL query via gh CLI
 */
export async function executeGraphQL(query: string, variables: Record<string, any>): Promise<any>

/**
 * Get GitHub node ID for an issue
 */
export async function getIssueNodeId(owner: string, repo: string, issueNumber: number): Promise<string>

/**
 * Get GitHub node ID for a PR
 */
export async function getPrNodeId(owner: string, repo: string, prNumber: number): Promise<string>

/**
 * Create a sub-issue linked to a parent issue
 */
export async function createSubIssue(
  parentNodeId: string,
  title: string,
  body?: string
): Promise<{ nodeId: string; number: number }>

/**
 * Add existing issue as sub-issue to parent
 */
export async function addSubIssue(parentNodeId: string, childNodeId: string): Promise<void>

/**
 * List all sub-issues of a parent issue
 */
export async function listSubIssues(parentNodeId: string): Promise<Array<{
  number: number
  title: string
  state: string
  nodeId: string
}>>

/**
 * Resolve a review thread
 */
export async function resolveReviewThread(threadNodeId: string): Promise<void>

/**
 * List all review threads for a PR
 */
export async function listReviewThreads(prNodeId: string): Promise<Array<{
  id: string
  nodeId: string
  isResolved: boolean
  path: string
  line: number | null
}>>
```

**`src/lib/github-rest.ts`** (NEW)

```typescript
/**
 * Add a blocked_by dependency to an issue
 */
export async function addIssueDependency(
  owner: string,
  repo: string,
  issueNumber: number,
  blockedByNumber: number
): Promise<void>

/**
 * Remove a blocked_by dependency from an issue
 */
export async function removeIssueDependency(
  owner: string,
  repo: string,
  issueNumber: number,
  blockerNumber: number
): Promise<void>

/**
 * List all dependencies for an issue
 */
export async function listIssueDependencies(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<Array<{
  number: number
  title: string
  state: string
}>>
```

**`src/lib/please-trigger.ts`** (NEW)

```typescript
export type PleaseTriggerType = 'triage' | 'investigate' | 'fix' | 'review' | 'apply'

/**
 * Create a PleaseAI trigger comment on an issue
 */
export async function triggerPleaseAI(
  type: PleaseTriggerType,
  owner: string,
  repo: string,
  issueOrPrNumber: number
): Promise<void>

/**
 * Build trigger comment body
 */
export function buildTriggerComment(type: PleaseTriggerType): string
```

**`src/lib/github-api.ts`** (EXTEND)

Add these functions:

```typescript
/**
 * Get current repository info (owner, repo)
 */
export async function getRepoInfo(): Promise<{ owner: string; repo: string }>

/**
 * Create a comment on an issue
 */
export async function createIssueComment(
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<void>

/**
 * Create a comment on a PR
 */
export async function createPrComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<void>
```

**`src/types.ts`** (EXTEND)

```typescript
// Existing types remain...

export interface IssueInfo {
  number: number
  owner: string
  repo: string
  nodeId?: string
}

export interface SubIssueCreateOptions {
  parentNodeId: string
  title: string
  body?: string
}

export interface IssueDependency {
  issueNumber: number
  blockedBy: number[]
}

export interface ReviewThread {
  id: string
  nodeId: string
  isResolved: boolean
  path: string
  line: number | null
}

export type PleaseTriggerType = 'triage' | 'investigate' | 'fix' | 'review' | 'apply'
```

**Tests**: `test/lib/github-graphql.test.ts`, `test/lib/github-rest.test.ts`, `test/lib/please-trigger.test.ts`

---

### Phase 2: AI Trigger Commands

**Goal**: Implement commands that trigger PleaseAI bot via comments.

#### Files to Create

**`src/commands/ai/triage.ts`**

```typescript
import { Command } from "commander"
import { getRepoInfo } from "../../lib/github-api"
import { triggerPleaseAI } from "../../lib/please-trigger"

export function createTriageCommand(): Command {
  const command = new Command("triage")

  command
    .description("Trigger PleaseAI to triage an issue")
    .argument("<issue-number>", "Issue number to triage")
    .action(async (issueNumberStr: string) => {
      try {
        const issueNumber = parseInt(issueNumberStr, 10)
        if (isNaN(issueNumber)) {
          throw new Error("Issue number must be a valid number")
        }

        const { owner, repo } = await getRepoInfo()

        console.log(`🤖 Triggering PleaseAI triage for issue #${issueNumber}...`)
        await triggerPleaseAI('triage', owner, repo, issueNumber)
        console.log(`✅ Triage request posted to issue #${issueNumber}`)
        console.log(`   View: https://github.com/${owner}/${repo}/issues/${issueNumber}`)
      } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        process.exit(1)
      }
    })

  return command
}
```

**Similar files**:
- `src/commands/ai/investigate.ts`
- `src/commands/ai/fix.ts`
- `src/commands/ai/review.ts` (uses prNumber instead)
- `src/commands/ai/apply.ts` (uses prNumber instead)

**`src/commands/ai/index.ts`**

```typescript
import { Command } from "commander"
import { createTriageCommand } from "./triage"
import { createInvestigateCommand } from "./investigate"
import { createFixCommand } from "./fix"
import { createReviewCommand } from "./review"
import { createApplyCommand } from "./apply"

export function createAiCommand(): Command {
  const command = new Command("ai")

  command.description("Trigger PleaseAI workflows")

  command.addCommand(createTriageCommand())
  command.addCommand(createInvestigateCommand())
  command.addCommand(createFixCommand())
  command.addCommand(createReviewCommand())
  command.addCommand(createApplyCommand())

  return command
}
```

**Tests**: `test/commands/ai/*.test.ts`

---

### Phase 3: Issue Management - Sub-issue

**Goal**: Implement sub-issue creation and management.

#### Files to Create

**`src/commands/issue/sub-issue.ts`**

```typescript
import { Command } from "commander"
import { getRepoInfo } from "../../lib/github-api"
import { getIssueNodeId, createSubIssue, addSubIssue, listSubIssues } from "../../lib/github-graphql"

export function createSubIssueCommand(): Command {
  const command = new Command("sub-issue")

  command.description("Manage sub-issues")

  // Create subcommand
  const createCmd = new Command("create")
    .description("Create a new sub-issue")
    .argument("<parent-issue>", "Parent issue number")
    .requiredOption("--title <text>", "Sub-issue title")
    .option("--body <text>", "Sub-issue body")
    .action(async (parentStr: string, options: { title: string; body?: string }) => {
      try {
        const parentNumber = parseInt(parentStr, 10)
        if (isNaN(parentNumber)) {
          throw new Error("Parent issue number must be valid")
        }

        const { owner, repo } = await getRepoInfo()
        console.log(`🔍 Getting parent issue #${parentNumber}...`)

        const parentNodeId = await getIssueNodeId(owner, repo, parentNumber)

        console.log(`📝 Creating sub-issue...`)
        const { number, nodeId } = await createSubIssue(parentNodeId, options.title, options.body)

        console.log(`✅ Sub-issue #${number} created!`)
        console.log(`   View: https://github.com/${owner}/${repo}/issues/${number}`)
      } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        process.exit(1)
      }
    })

  // Add subcommand
  const addCmd = new Command("add")
    .description("Add existing issue as sub-issue")
    .argument("<parent-issue>", "Parent issue number")
    .argument("<child-issue>", "Child issue number to add")
    .action(async (parentStr: string, childStr: string) => {
      // Implementation similar to create
    })

  // List subcommand
  const listCmd = new Command("list")
    .description("List all sub-issues")
    .argument("<parent-issue>", "Parent issue number")
    .action(async (parentStr: string) => {
      // Fetch and display sub-issues
    })

  command.addCommand(createCmd)
  command.addCommand(addCmd)
  command.addCommand(listCmd)

  return command
}
```

**`src/commands/issue/index.ts`**

```typescript
import { Command } from "commander"
import { createSubIssueCommand } from "./sub-issue"
import { createDependencyCommand } from "./dependency"

export function createIssueCommand(): Command {
  const command = new Command("issue")

  command.description("Manage GitHub issues")

  command.addCommand(createSubIssueCommand())
  command.addCommand(createDependencyCommand())

  return command
}
```

**Tests**: `test/commands/issue/sub-issue.test.ts`

---

### Phase 4: Issue Management - Dependency

**Goal**: Implement issue dependency management (blocked_by).

#### Files to Create

**`src/commands/issue/dependency.ts`**

Similar structure to sub-issue.ts but using REST API functions:
- `add` subcommand: calls `addIssueDependency()`
- `remove` subcommand: calls `removeIssueDependency()`
- `list` subcommand: calls `listIssueDependencies()`

**Tests**: `test/commands/issue/dependency.test.ts`

---

### Phase 5: PR Management - Review Reply Refactor

**Goal**: Move review-reply to pr group, add deprecation warning.

#### Files to Modify/Create

**Move file**: `src/commands/review-reply.ts` → `src/commands/pr/review-reply.ts`

**`src/commands/pr/index.ts`** (NEW)

```typescript
import { Command } from "commander"
import { createReviewReplyCommand } from "./review-reply"
import { createResolveCommand } from "./resolve"

export function createPrCommand(): Command {
  const command = new Command("pr")

  command.description("Manage pull requests")

  command.addCommand(createReviewReplyCommand())
  command.addCommand(createResolveCommand())

  return command
}
```

**`src/index.ts`** (MODIFY)

Add deprecated command:

```typescript
// Deprecated: backward compatibility
const deprecatedReviewReply = new Command("review-reply")
  .description("(Deprecated) Use 'gh please pr review-reply' instead")
  .argument("<comment-id>", "ID of the review comment")
  .option("-b, --body <text>", "Reply body text")
  .action(async (commentId: string, options: { body?: string }) => {
    console.warn("⚠️  Warning: 'gh please review-reply' is deprecated.")
    console.warn("   Please use 'gh please pr review-reply' instead.")
    console.warn("")

    // Import and execute the new command
    const { createReviewReplyCommand } = await import("./commands/pr/review-reply")
    const cmd = createReviewReplyCommand()
    await cmd.parseAsync([commentId, ...(options.body ? ['-b', options.body] : [])], { from: 'user' })
  })

program.addCommand(deprecatedReviewReply)
```

**Tests**: Move `test/lib/github-api.test.ts` review-reply tests to `test/commands/pr/review-reply.test.ts`

---

### Phase 6: PR Management - Resolve Threads

**Goal**: Implement review thread resolution.

#### Files to Create

**`src/commands/pr/resolve.ts`**

```typescript
import { Command } from "commander"
import { getRepoInfo } from "../../lib/github-api"
import { getPrNodeId, listReviewThreads, resolveReviewThread } from "../../lib/github-graphql"

export function createResolveCommand(): Command {
  const command = new Command("resolve")

  command
    .description("Resolve review threads on a pull request")
    .argument("<pr-number>", "Pull request number")
    .option("--thread <id>", "Specific thread ID to resolve")
    .option("--all", "Resolve all unresolved threads")
    .action(async (prNumberStr: string, options: { thread?: string; all?: boolean }) => {
      try {
        const prNumber = parseInt(prNumberStr, 10)
        if (isNaN(prNumber)) {
          throw new Error("PR number must be valid")
        }

        if (!options.thread && !options.all) {
          throw new Error("Must specify either --thread <id> or --all")
        }

        const { owner, repo } = await getRepoInfo()
        const prNodeId = await getPrNodeId(owner, repo, prNumber)

        if (options.all) {
          console.log(`🔍 Fetching review threads for PR #${prNumber}...`)
          const threads = await listReviewThreads(prNodeId)
          const unresolved = threads.filter(t => !t.isResolved)

          if (unresolved.length === 0) {
            console.log(`✅ All threads are already resolved!`)
            return
          }

          console.log(`📝 Resolving ${unresolved.length} thread(s)...`)
          for (const thread of unresolved) {
            await resolveReviewThread(thread.nodeId)
          }
          console.log(`✅ Resolved ${unresolved.length} thread(s)!`)
        } else if (options.thread) {
          console.log(`📝 Resolving thread ${options.thread}...`)
          await resolveReviewThread(options.thread)
          console.log(`✅ Thread resolved!`)
        }

        console.log(`   View: https://github.com/${owner}/${repo}/pull/${prNumber}`)
      } catch (error) {
        console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        process.exit(1)
      }
    })

  return command
}
```

**Tests**: `test/commands/pr/resolve.test.ts`

---

### Phase 7: Integration

**Goal**: Wire all commands together in main entry point.

#### Files to Modify

**`src/index.ts`**

```typescript
#!/usr/bin/env bun

import { Command } from "commander"
import { createAiCommand } from "./commands/ai"
import { createIssueCommand } from "./commands/issue"
import { createPrCommand } from "./commands/pr"
import { createInitCommand } from "./commands/init"

const program = new Command()

program
  .name("gh-please")
  .description("GitHub CLI extension for PleaseAI automation")
  .version("0.2.0")

// Add command groups
program.addCommand(createAiCommand())
program.addCommand(createIssueCommand())
program.addCommand(createPrCommand())
program.addCommand(createInitCommand())

// Deprecated commands (backward compatibility)
const deprecatedReviewReply = new Command("review-reply")
  .description("(Deprecated) Use 'gh please pr review-reply' instead")
  .argument("<comment-id>", "ID of the review comment")
  .option("-b, --body <text>", "Reply body text")
  .action(async (commentId: string, options: { body?: string }) => {
    console.warn("⚠️  Warning: 'gh please review-reply' is deprecated.")
    console.warn("   Please use 'gh please pr review-reply' instead.")
    console.warn("")

    const { createReviewReplyCommand } = await import("./commands/pr/review-reply")
    const cmd = createReviewReplyCommand()
    await cmd.parseAsync([commentId, ...(options.body ? ['-b', options.body] : [])], { from: 'user' })
  })

program.addCommand(deprecatedReviewReply)

// Show help if no command
if (process.argv.length <= 2) {
  program.help()
}

program.parse()
```

---

### Phase 8: Testing & Documentation

**Goal**: Comprehensive testing and documentation updates.

#### Testing Strategy

1. **Unit tests**: Individual functions in `lib/` (mocked Bun.spawn)
2. **Integration tests**: Commands with mocked GitHub API responses
3. **Manual testing**: Real GitHub repository test cases

**Test Coverage Goals**:
- `lib/` functions: 90%+
- Commands: 80%+
- Critical paths (GraphQL queries, error handling): 100%

#### Documentation Updates

**`CLAUDE.md`** - Add sections:
- New command structure overview
- Examples for each command group
- Migration guide from old `review-reply`

**`README.md`** (create if needed):
- Installation instructions
- Quick start guide
- Command reference
- Examples

---

## Implementation Order

1. ✅ **Phase 1**: Infrastructure (blocking for all others)
2. **Phase 2**: AI triggers (high value, independent)
3. **Phase 5**: PR review-reply refactor (quick win, maintains existing functionality)
4. **Phase 3**: Sub-issue management
5. **Phase 4**: Dependency management
6. **Phase 6**: PR resolve
7. **Phase 7**: Integration
8. **Phase 8**: Testing & docs

## Dependencies

```
Phase 1 (Infrastructure)
  ├─→ Phase 2 (AI triggers)
  ├─→ Phase 3 (Sub-issue)
  ├─→ Phase 4 (Dependency)
  ├─→ Phase 5 (Review-reply refactor)
  │    └─→ Phase 6 (PR resolve)
  └─→ Phase 7 (Integration)
        └─→ Phase 8 (Testing & docs)
```

## Estimated Effort

- **Phase 1**: 4-6 hours (GraphQL/REST clients, trigger helpers)
- **Phase 2**: 2-3 hours (5 similar commands)
- **Phase 3**: 2-3 hours (sub-issue commands)
- **Phase 4**: 2-3 hours (dependency commands)
- **Phase 5**: 1-2 hours (refactor + deprecation)
- **Phase 6**: 2-3 hours (resolve command + GraphQL)
- **Phase 7**: 1 hour (integration)
- **Phase 8**: 4-5 hours (tests + docs)

**Total**: ~18-26 hours

## Success Criteria

- [ ] All commands implemented and working
- [ ] Test coverage >80%
- [ ] Documentation complete
- [ ] No breaking changes to existing functionality
- [ ] Deprecation warnings working
- [ ] All GitHub issue sub-tasks completed
