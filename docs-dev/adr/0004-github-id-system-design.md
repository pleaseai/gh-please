# ADR 0004: GitHub ID System Design and Usage Strategy

## Status

Accepted

## Context

GitHub uses three different ID systems across its REST and GraphQL APIs, each serving different purposes and having different characteristics. This creates confusion for CLI tool developers and users about which ID to use in which context.

### GitHub's Three ID Systems

#### 1. Number (Issue/PR Number)
```bash
# Most user-friendly - visible in GitHub UI
Issue #123, PR #456
```
- **Format**: Positive integer (e.g., `123`, `456`)
- **Scope**: Repository-specific, sequential
- **Applies to**: Issue, PullRequest, Workflow Run, Discussion
- **REST API**: Used in URL paths (`/repos/{owner}/{repo}/issues/123`)
- **GraphQL API**: `repository(owner, name) { issue(number: 123) }`

#### 2. Database ID (REST API ID)
```bash
# Internal identifier - returned in API responses
2442802556
```
- **Format**: Large integer (e.g., `2442802556`)
- **Scope**: GitHub-wide unique identifier
- **Applies to**: All types except PullRequestReviewThread
- **REST API**: Returned as `id` field in responses
- **GraphQL API**: Available as `databaseId` field (when provided)

#### 3. Node ID (GraphQL Global ID)
```bash
# Global identifier - Base64 encoded
I_kwDOABC123, PRRT_kwDODEF456
```
- **Format**: Base64-encoded string
- **Composition**: Encodes `type + databaseId`
- **Scope**: GitHub-wide globally unique
- **Applies to**: All types (universal)
- **REST API**: Returned as `node_id` field
- **GraphQL API**: Primary identifier (`id` field), used in `node(id: "...")` queries

### Current Problems

1. **Inconsistent ID usage**: Some commands use numbers, others use database IDs, without clear guidelines
2. **User confusion**: Users don't know which ID format to use for which command
3. **API mismatch**: REST and GraphQL APIs use different ID field names for the same concept
4. **Missing documentation**: No comprehensive guide explaining when to use which ID type
5. **Type safety**: No TypeScript types to distinguish between different ID formats

### GraphQL Schema Analysis

Based on `docs-dev/github/schema.docs.graphql`, ID compatibility varies by type:

| Type | Number | Database ID | Node ID | `databaseId` in GraphQL |
|------|--------|-------------|---------|------------------------|
| Issue | ✅ | ✅ | ✅ | ✅ Available |
| PullRequest | ✅ | ✅ | ✅ | ✅ Available |
| IssueComment | ❌ | ✅ | ✅ | ✅ Available |
| PullRequestReviewComment | ❌ | ✅ | ✅ | ✅ Available |
| **PullRequestReviewThread** | **❌** | **❌ Not available** | **✅** | **❌ GraphQL-only** |

**Key finding**: `PullRequestReviewThread` is a GraphQL-only type with no REST API equivalent and no `databaseId` field.

## Decision

Adopt a **hierarchical ID strategy** that prioritizes user experience while maintaining technical correctness:

### 1. Number First (Highest Priority)
**Always use Number when available** - it's the most user-friendly format.

```bash
# Issue and PR operations always use Number
gh please issue sub-issue add 123 456      # Both are issueNumbers
gh please pr review thread resolve 456 --all  # prNumber
```

**Implementation**:
```typescript
// Always convert Number to Node ID internally
getIssueNodeId(owner: string, repo: string, issueNumber: number): Promise<string>
getPrNodeId(owner: string, repo: string, prNumber: number): Promise<string>
```

### 2. Automatic ID Type Detection (Middle Priority)
**Auto-detect Database ID vs Node ID** based on format.

```bash
# Numeric input → Database ID (REST API)
gh please pr review reply 2442802556 -b "Fixed!"

# String input → Node ID (GraphQL API)
gh please pr review thread resolve 456 --thread PRRT_kwDOABC123
```

**Implementation**:
```typescript
function parseId(input: string): { type: 'number' | 'nodeId', value: string | number } {
  const asNumber = Number.parseInt(input, 10)
  if (!isNaN(asNumber) && asNumber.toString() === input) {
    return { type: 'number', value: asNumber }
  }
  return { type: 'nodeId', value: input }
}
```

### 3. Explicit Node ID (When Required)
**Use Node ID directly** for GraphQL-only types that lack alternatives.

```bash
# Thread is GraphQL-only, requires Node ID
gh please pr review thread list 456                    # Get Node IDs
gh please pr review thread resolve 456 --thread PRRT_kwDOABC123
```

### Command Design Principles

1. **User input**: Always accept the most user-friendly format (Number > Database ID > Node ID)
2. **Internal processing**: Convert to appropriate ID type based on target API
3. **Error messages**: Clearly indicate which ID format is expected
4. **Documentation**: Explicitly document which ID type each command accepts

### Type System Design

Define branded types to prevent ID misuse at compile time:

```typescript
// Prevent mixing different ID types
export type IssueNumber = number & { readonly __brand: 'IssueNumber' }
export type PrNumber = number & { readonly __brand: 'PrNumber' }
export type CommentId = number & { readonly __brand: 'CommentId' } // Database ID
export type NodeId = string & { readonly __brand: 'NodeId' }
export type ThreadNodeId = string & { readonly __brand: 'ThreadNodeId' }

// Helper functions for type-safe conversion
export function toIssueNumber(n: number): IssueNumber {
  return n as IssueNumber
}
```

## Consequences

### Positive

1. **Better UX**: Users can use familiar Issue/PR numbers instead of cryptic IDs
2. **Clear guidelines**: Explicit documentation on when to use which ID format
3. **Type safety**: Branded types prevent accidental ID misuse
4. **API alignment**: Strategy respects the differences between REST and GraphQL APIs
5. **Extensibility**: Easy to add new commands with appropriate ID handling

### Negative

1. **Complexity**: More ID conversion logic required internally
2. **Performance**: Number → Node ID conversion requires additional API calls
   - **Mitigation**: Cache conversions, batch requests when possible
3. **Error handling**: More failure points (conversion failures, invalid IDs)
   - **Mitigation**: Clear error messages explaining ID requirements

### Neutral

1. **Documentation burden**: Comprehensive ID guide needed in CLAUDE.md
2. **Learning curve**: Users must understand when Number is available vs when Node ID is required

## Alternatives Considered

### Option 1: Node ID Everywhere (GraphQL-First)
```bash
gh please issue sub-issue add I_kwDOABC123 I_kwDODEF456
```

**Rejected because**:
- Poor user experience (cryptic IDs instead of familiar #123)
- Requires users to manually look up Node IDs
- Doesn't leverage GitHub's user-friendly Number system

### Option 2: Always Accept All ID Types
```bash
gh please pr review reply <number|database-id|node-id>
```

**Rejected because**:
- Ambiguous: How to distinguish `123` as Number vs Database ID?
- Complex validation logic
- Doesn't provide clear guidance to users

### Option 3: Separate Commands for Each ID Type
```bash
gh please pr review reply-by-number 123
gh please pr review reply-by-id 2442802556
gh please pr review reply-by-node PRRT_kwDO...
```

**Rejected because**:
- Command explosion (3x more commands)
- User confusion about which command to use
- Violates DRY principle

## Implementation Plan

### Phase 1: Documentation (This ADR)
1. ✅ Create ADR document explaining ID systems
2. Update `CLAUDE.md` with comprehensive ID guide
3. Add ID compatibility matrix to documentation

### Phase 2: Type System Enhancement (Optional)
1. Define branded types in `src/types.ts`
2. Update function signatures to use branded types
3. Add helper functions for type-safe ID handling

### Phase 3: Feature Addition
1. Implement `pr review thread list` command to expose Node IDs
2. Display copy-ready commands in thread list output
3. Add unit tests for ID handling logic

### Phase 4: Validation & Testing
1. Add ID format validation utilities
2. Test ID conversion edge cases
3. Verify error messages are clear and helpful

## Examples

### Preferred: Using Number
```bash
# Issue operations - always use Number
gh please issue sub-issue add 14 16        # Parent #14, child #16
gh please issue dependency add 14 --blocked-by 15

# PR operations - always use Number for PR identification
gh please pr review thread resolve 456 --all
gh please pr review thread list 456
```

### Database ID: Automatic Detection
```bash
# Comment operations - Database ID auto-detected (numeric)
gh please pr review reply 2442802556 -b "Fixed!"
gh please pr review comment edit 2442802556 --body "Updated"
```

### Node ID: Explicit When Required
```bash
# Thread operations - Node ID required (GraphQL-only type)
gh please pr review thread list 456
# Output shows: PRRT_kwDOABC123

gh please pr review thread resolve 456 --thread PRRT_kwDOABC123
```

## References

- GitHub GraphQL Schema: `docs-dev/github/schema.docs.graphql`
- GitHub GraphQL Docs: https://docs.github.com/en/graphql/guides/using-global-node-ids
- Related ADR: [0001: PR Review Command Structure](./0001-pr-review-command-structure.md)
- GitHub REST API Docs: https://docs.github.com/en/rest
- Stack Overflow Discussion: [What is the difference between ID and databaseID in GitHub GraphQL API?](https://stackoverflow.com/questions/56177841)

## Notes

### Why PullRequestReviewThread Lacks databaseId

Review threads were introduced as a GraphQL-only feature. GitHub never added REST API support for thread management, so there's no corresponding Database ID. This is intentional design - newer GitHub features are GraphQL-first.

### Future Considerations

1. **Caching**: Consider caching Number → Node ID conversions to reduce API calls
2. **Batch operations**: When processing multiple items, batch Node ID lookups
3. **Offline mode**: Some operations might not work without API access for ID conversion
4. **Rate limiting**: ID conversion uses API quota - document this in user guide
