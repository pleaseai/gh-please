# GitHub ID Systems Guide

GitHub uses three different ID systems across its APIs. Understanding when to use each is crucial for effective CLI usage.

## 1. Number (Issue/PR Number) - **PREFERRED**

The most user-friendly identifier - use whenever possible.

- **Format**: Positive integer (e.g., `123`, `456`)
- **Visible**: In GitHub UI as `#123`
- **Scope**: Repository-specific, sequential
- **Applies to**: Issue, PullRequest, Workflow Run, Discussion
- **REST API**: URL path (`/repos/{owner}/{repo}/issues/123`)
- **GraphQL API**: `repository(owner, name) { issue(number: 123) }`

**Usage in gh-please**:
```bash
# Issue operations - always use Number
gh please issue sub-issue add 14 16        # Parent #14, child #16
gh please issue dependency add 14 --blocked-by 15

# PR operations - always use Number for PR identification
gh please pr review thread resolve 456 --all
gh please pr review thread list 456
```

**Internal implementation**:
```typescript
// Always convert Number to Node ID for GraphQL operations
getIssueNodeId(owner, repo, issueNumber: number) → nodeId: string
getPrNodeId(owner, repo, prNumber: number) → nodeId: string
```

## 2. Database ID (REST API ID) - **AUTO-DETECTED**

Internal identifier used by REST API, automatically handled by gh-please.

- **Format**: Large integer (e.g., `2442802556`)
- **Scope**: GitHub-wide unique
- **Applies to**: All types except PullRequestReviewThread
- **REST API**: Returned as `id` field
- **GraphQL API**: Available as `databaseId` field (when provided)

**Usage in gh-please**:
```bash
# Comment operations - Both Database ID and Node ID supported (auto-detected)
gh please pr review reply 2442802556 -b "Fixed!"                  # Database ID (numeric)
gh please pr review reply PRRC_kwDOP34zbs6ShH0J -b "Fixed!"       # Node ID (string)
gh please pr review comment edit 2442802556 --body "Updated" --pr 456
gh please pr review comment edit PRRC_kwDOP34zbs6ShH0J --body "Updated"
gh please issue comment edit 123456789 --body "Corrected" --issue 123
gh please issue comment edit IC_kwDOABC123 --body "Corrected"
```

**ID Type Detection**:
- Node ID: Auto-detected by format pattern (`^[A-Z]{1,4}_[\w-]+$`)
- Database ID: Auto-detected by numeric format, converted to Node ID via REST API list endpoint

**ID Converter Utility** (`src/lib/id-converter.ts`):
The CLI automatically converts Database ID to Node ID when needed:
1. Detects input format (Database ID or Node ID)
2. If Database ID: fetches comment list from REST API, extracts `node_id`
3. If Node ID: uses directly without conversion
4. Performs GraphQL operations using Node ID

This enables support for **general review comments** (`line: null`) that cannot be accessed via REST API.

## 3. Node ID (GraphQL Global ID) - **REQUIRED FOR THREADS**

GraphQL's universal identifier, required for types without Database ID.

- **Format**: Base64-encoded string (e.g., `I_kwDOABC123`, `PRRT_kwDODEF456`)
- **Composition**: Encodes `type + databaseId` (when databaseId exists)
- **Scope**: GitHub-wide globally unique
- **Applies to**: All types (universal)
- **REST API**: Returned as `node_id` field
- **GraphQL API**: Primary identifier (`id` field), `node(id: "...")` queries

### Node ID Formats

GitHub uses two Node ID formats:

#### New Format (MessagePack + Base64)
- **Pattern**: `PREFIX_base64EncodedMessagePack`
- **Example**: `PRRC_kwDOL4aMSs6Tkzl8`
- **Structure**: MessagePack array `[version, repositoryId, databaseId]`
- **Prefixes**: `I_` (Issue), `PR_` (PullRequest), `IC_` (IssueComment), `PRRC_` (PullRequestReviewComment), `PRRT_` (PullRequestReviewThread), `R_` (Repository), etc.

#### Legacy Format (Text Base64)
- **Pattern**: Base64-encoded `"XXX:TypeNameDatabaseId"`
- **Example**: `MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=` (decodes to `"010:Repository139095377"`)
- **Used by**: Older repositories (pre-2011)

### Offline Node ID Decoding

gh-please provides **offline Node ID decoding** without API calls:

```typescript
import { decodeNodeId, extractDatabaseId } from 'gh-please/lib/id-converter'

// Decode New format Node ID
const result = decodeNodeId('PRRC_kwDOL4aMSs6Tkzl8')
// → { type: 'PullRequestReviewComment', databaseId: 2475899260, repositoryId: 797346890, format: 'new' }

// Decode Legacy format Node ID
const legacy = decodeNodeId('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')
// → { type: 'Repository', databaseId: 139095377, format: 'legacy' }

// Extract only Database ID
const dbId = extractDatabaseId('PRRC_kwDOL4aMSs6Tkzl8')
// → 2475899260
```

### Offline Node ID Encoding

gh-please also provides **offline Node ID encoding** (Database ID → Node ID):

```typescript
import { encodeNodeId } from 'gh-please/lib/id-converter'

// Encode using type name
const nodeId = encodeNodeId({
  type: 'PullRequestReviewComment',
  repositoryId: 797346890,
  databaseId: 2475899260,
})
// → 'PRRC_kwDOL4aMSs6Tkzl8'

// Encode using prefix
const nodeId2 = encodeNodeId({
  prefix: 'I_',
  repositoryId: 797346890,
  databaseId: 123456,
})
// → 'I_kwDOL4aMSs4AAeJA'
```

**Requirements for encoding**:
- `type` or `prefix`: Specifies the GitHub entity type
- `repositoryId`: The repository's database ID (available from decoded Node IDs)
- `databaseId`: The entity's database ID to encode

**Benefits**:
- No API calls required
- Works offline
- Instant response (synchronous)
- Supports both New and Legacy formats (decoding)
- Roundtrip safe: `decode(encode(x)) === x`

**Reference**: See [Greptile Blog: GitHub IDs](https://www.greptile.com/blog/github-ids) for the original research.

**Usage in gh-please**:
```bash
# Thread operations - Node ID required (GraphQL-only type)
gh please pr review thread list 456                    # Get Node IDs
gh please pr review thread resolve 456 --thread PRRT_kwDOABC123

# Comment operations - Both Database ID and Node ID supported
gh please pr review reply 2442802556 -b "Reply"              # Database ID
gh please pr review reply PRRC_kwDOP34zbs6ShH0J -b "Reply"  # Node ID (direct)
```

**Why Node ID is required for threads**: `PullRequestReviewThread` is a GraphQL-exclusive type with no REST API equivalent and no `databaseId` field.

**Why both IDs work for comments**: The ID converter utility (`src/lib/id-converter.ts`) automatically handles conversion, enabling flexible input and support for all comment types including general review comments.

## ID Compatibility Matrix

| GitHub Type | Number | Database ID | Node ID | GraphQL `databaseId` | Conversion |
|-------------|--------|-------------|---------|---------------------|------------|
| **Issue** | ✅ `#123` | ✅ | ✅ | ✅ Available | Number ↔ Node ID |
| **PullRequest** | ✅ `#456` | ✅ | ✅ | ✅ Available | Number ↔ Node ID |
| **IssueComment** | ❌ | ✅ | ✅ | ✅ Available | Database ID ↔ Node ID |
| **PullRequestReviewComment** | ❌ | ✅ | ✅ | ✅ Available | Database ID ↔ Node ID |
| **PullRequestReviewThread** | **❌** | **❌ None** | **✅ Only** | **❌ N/A** | **Node ID only** |

## Design Principles (ADR 0004)

1. **Number First**: Always use Issue/PR Number when available (most user-friendly)
2. **Auto-Detection**: Automatically distinguish Database ID (number) from Node ID (string)
3. **Explicit When Required**: Use Node ID directly for GraphQL-only types (threads)
4. **Clear Documentation**: Each command documents which ID format it accepts

**Reference**: See `docs-dev/adr/0004-github-id-system-design.md` for detailed rationale and alternatives considered.

## GraphQL Schema Reference

Full GitHub GraphQL schema available at: `docs-dev/github/schema.docs.graphql`

**Example queries**:
```graphql
# Query by Number (requires repository context)
query {
  repository(owner: "owner", name: "repo") {
    issue(number: 123) {
      id              # Node ID: I_kwDO...
      databaseId      # Database ID: 2442802556
      number          # Number: 123
    }
  }
}

# Query by Node ID (global, no context needed)
query {
  node(id: "I_kwDOABC123") {
    ... on Issue {
      number        # 123
      databaseId    # 2442802556
    }
  }
}
```