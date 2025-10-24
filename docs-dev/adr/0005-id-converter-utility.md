# ADR 0005: GitHub ID Converter Utility

## Status

Proposed

## Context

### Problem

GitHub uses multiple ID systems (Database ID and Node ID), and different API endpoints have different accessibility constraints:

1. **General review comments** (`line: null`) cannot be accessed via REST API's `/pulls/{pr}/comments/{comment_id}` endpoint, resulting in 404 errors
2. Current commands only accept Database ID (numeric), limiting user flexibility
3. Each command reimplements ID handling logic independently

### Example Scenario

```bash
# This fails for general review comments (line: null)
gh please pr review reply 2458156297 -b "Reply text"
# Error: Failed to fetch comment 2458156297: gh: Not Found (HTTP 404)

# However, the comment exists and has a Node ID
# Database ID: 2458156297
# Node ID: PRRC_kwDOP34zbs6ShH0J
```

### GitHub REST API Behavior

The REST API endpoint `/repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}` only supports **line-level review comments** (comments with `line` field). General/file-level review comments (`line: null`) are accessible only through:
- GraphQL API (using Node ID)
- REST API's list endpoint (`/pulls/{pr}/comments`), which includes `node_id` field

### Current Commands Affected

1. `gh please pr review reply <comment-id>` - Create reply to review comment
2. `gh please pr review comment edit <comment-id>` - Edit review comment
3. `gh please issue comment edit <comment-id>` - Edit issue comment

## Decision

We will create a **centralized ID converter utility** (`src/lib/id-converter.ts`) that:

1. **Detects ID format** automatically (Database ID vs Node ID)
2. **Converts Database ID to Node ID** when needed using REST API
3. **Provides reusable functions** for all comment-related commands
4. **Supports both input formats** for better UX

### Architecture

```
User Input (Database ID or Node ID)
    ↓
id-converter.ts: Auto-detect format
    ↓
if Node ID → Return as-is
if Database ID → Fetch from REST API → Extract node_id
    ↓
GraphQL operations (using Node ID)
```

### API Strategy

**For Review Comments**:
```typescript
// Step 1: Convert to Node ID (if needed)
const nodeId = await toReviewCommentNodeId(identifier, owner, repo, prNumber)

// Step 2: Use GraphQL with Node ID
await createReviewCommentReply(nodeId, body)
```

**REST API** (`GET /pulls/{pr}/comments`):
- Returns all comments including `node_id` field
- Works for both line-level and general comments
- Used only for ID conversion, not for mutations

**GraphQL API** (`addPullRequestReviewComment` mutation):
- Accepts Node ID via `inReplyTo` parameter
- Works for all comment types (line-level and general)
- Used for actual operations (create reply, update, etc.)

## Consequences

### Positive

1. **Complete comment type support**: Line-level and general review comments both work
2. **Flexible user input**: Users can provide Database ID or Node ID
3. **Code reusability**: All comment commands share the same conversion logic
4. **Future-proof**: Easy to extend to other GitHub entities (issues, PRs, etc.)
5. **Backward compatibility**: Existing Database ID inputs continue to work

### Negative

1. **Additional API call**: When using Database ID, requires extra REST API call for conversion
   - Mitigation: Only 1 extra call per operation, acceptable overhead
2. **Complexity**: Adds abstraction layer between user input and API calls
   - Mitigation: Well-documented, centralized in single utility file

### Performance Impact

**Database ID input**:
- REST: `GET /pulls/{pr}/comments` (1 call) - fetch node_id
- GraphQL: Mutation (1 call) - perform operation
- **Total: 2 API calls**

**Node ID input**:
- GraphQL: Mutation (1 call) - perform operation
- **Total: 1 API call**

Users who need optimal performance can use Node ID directly.

## Implementation Plan

### Phase 1: Core Utility (High Priority)

**File**: `src/lib/id-converter.ts`

```typescript
// ID format detection
export function isNodeId(identifier: string): boolean
export function isDatabaseId(identifier: string): boolean

// Conversion functions
export async function toReviewCommentNodeId(
  identifier: string,
  owner: string,
  repo: string,
  prNumber: number
): Promise<string>

export async function toIssueCommentNodeId(
  identifier: string,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<string>

// Validation
export function validateCommentIdentifier(identifier: string): string
```

### Phase 2: GraphQL Functions (High Priority)

**File**: `src/lib/github-graphql.ts`

```typescript
export async function createReviewCommentReply(
  commentNodeId: string,
  body: string
): Promise<{nodeId: string, databaseId: number, url: string}>

export async function updateReviewCommentByNodeId(
  commentNodeId: string,
  body: string
): Promise<void>

export async function updateIssueCommentByNodeId(
  commentNodeId: string,
  body: string
): Promise<void>
```

### Phase 3: Command Updates (Medium Priority)

Update commands to use new utility:
1. `src/commands/pr/review/reply.ts` - **Highest priority** (fixes the 404 issue)
2. `src/commands/pr/review/comment-edit.ts`
3. `src/commands/issue/comment-edit.ts`

### Phase 4: Testing & Documentation (Medium Priority)

- Unit tests for `id-converter.ts`
- Integration tests for updated commands
- Update CLAUDE.md with ID converter usage
- Update user documentation

## Alternatives Considered

### Alternative 1: Pure GraphQL (Database ID → Node ID via GraphQL)

**Approach**: Use GraphQL query to convert Database ID to Node ID
```graphql
query {
  repository(owner: "...", name: "...") {
    pullRequest(number: 84) {
      reviewThreads(first: 100) {
        nodes {
          comments(first: 100) {
            nodes {
              id          # Node ID
              databaseId  # Database ID
            }
          }
        }
      }
    }
  }
}
```

**Rejected because**:
- More complex query structure
- Same number of API calls (1 query + 1 mutation = 2 calls)
- REST API list endpoint is simpler and already used internally

### Alternative 2: Always Use Database ID with REST API

**Approach**: Continue using REST API for all operations

**Rejected because**:
- REST API cannot access general review comments (line: null)
- Would require complete API redesign for those comment types
- GraphQL provides unified access to all comment types

### Alternative 3: Require Users to Provide Node ID Only

**Approach**: Document that only Node ID is supported, users must convert manually

**Rejected because**:
- Poor user experience (most users familiar with Database ID)
- Breaks backward compatibility
- Users would need to manually query API for conversion

## References

- [GitHub REST API: Pull Request Review Comments](https://docs.github.com/en/rest/pulls/comments)
- [GitHub GraphQL API: addPullRequestReviewComment](https://docs.github.com/en/graphql/reference/mutations#addpullrequestreviewcomment)
- [ADR 0004: GitHub ID System Design](./0004-github-id-system-design.md)
- Related Issue: [#68](https://github.com/pleaseai/gh-please/issues/68)

## Decision Date

2025-01-24 (Draft)

## Decision Makers

- @amondnet - Project maintainer
- Claude Code - Architecture design assistant
