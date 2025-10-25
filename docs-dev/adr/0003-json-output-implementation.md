# ADR 0003: JSON Output Implementation

## Status

Accepted (2025-10-25)

## Context

The current CLI outputs are designed for human readability with emoji indicators, colored text, and natural language formatting. While this is excellent for interactive use, it creates challenges for:

1. **Automation**: Scripts and CI/CD pipelines need structured, parseable output
2. **LLM Integration**: AI agents require reliable data extraction from command outputs
3. **Tool Integration**: Connecting gh-please with other tools requires consistent data formats

### Current Behavior

```bash
$ gh please issue sub-issue list 123
🔍 Fetching sub-issues of #123...
✅ Found 3 sub-issue(s):

🟢 #124: Implement authentication module (OPEN)
🔴 #125: Add unit tests (CLOSED)
🟢 #126: Update documentation (OPEN)

View: https://github.com/owner/repo/issues/123
```

### Problems with Current Output

- **Brittle parsing**: Requires regex to extract issue numbers, titles, states
- **i18n complexity**: Output varies by locale (Korean/English)
- **No standard format**: Each command has different output structure
- **Tool incompatibility**: Cannot pipe to jq, python json, or other processors

### Why JSON Only?

ADR 0002 proposed Markdown/XML formats for "LLM-friendliness", but further analysis revealed:

1. **LLMs handle JSON better**
   - Clear key-value structure → accurate parsing
   - Widely represented in LLM training data (code examples, API docs)
   - Function calling and structured output use JSON natively

2. **Industry standard**
   - GitHub CLI: `gh issue list --json`
   - kubectl: `--output=json`
   - docker: `--format json`
   - REST APIs universally use JSON

3. **Tooling ecosystem**
   - `jq` for JSON processing
   - Native support in all programming languages
   - No additional parsing libraries needed

4. **Simplicity**
   - One format to implement and maintain
   - No format selection complexity (`--format json|markdown|xml`)
   - YAGNI: Add other formats only if concrete need emerges

## Decision

Implement **`--json` flag only** for list commands, following GitHub CLI patterns.

### Flag Behavior

```bash
# Output all fields as JSON array
gh please issue sub-issue list 123 --json

# Output specific fields only (future enhancement)
gh please issue sub-issue list 123 --json number,title,state
```

### Output Format

JSON array of objects, matching GitHub CLI style:

```json
[
  {
    "number": 124,
    "title": "Implement authentication module",
    "state": "OPEN",
    "nodeId": "I_kwDOABC123",
    "url": "https://github.com/owner/repo/issues/124"
  },
  {
    "number": 125,
    "title": "Add unit tests",
    "state": "CLOSED",
    "nodeId": "I_kwDODEF456",
    "url": "https://github.com/owner/repo/issues/125"
  }
]
```

### Scope

**Phase 1: List commands**
- `gh please issue sub-issue list`
- `gh please issue dependency list`
- `gh please pr review thread list`
- `gh please issue comment list`
- `gh please pr review comment list`

**Phase 2: Mutation commands** (future)
- Create/add/remove operations can return created resource data

## Implementation

### Architecture

```
src/lib/json-output.ts          # Core JSON utilities
├── parseFields()               # Parse comma-separated field list
├── filterFields()              # Filter objects by field list
└── outputJson()                # Print JSON to stdout

Commands (modified):
├── src/commands/issue/sub-issue.ts
├── src/commands/issue/dependency.ts
├── src/commands/pr/review/thread-list.ts
├── src/commands/issue/comment-list.ts
└── src/commands/pr/review/comment-list.ts
```

### JSON Output Utility

```typescript
// src/lib/json-output.ts

/**
 * Parse comma-separated field list from --json argument
 * @param fieldString - Field list string or boolean true
 * @returns Array of field names, or null for all fields
 */
export function parseFields(fieldString?: string | boolean): string[] | null {
  if (typeof fieldString !== 'string') return null
  return fieldString.split(',').map(f => f.trim()).filter(Boolean)
}

/**
 * Filter object or array to include only specified fields
 * @param data - Object or array to filter
 * @param fields - Field names to include (null = all fields)
 * @returns Filtered data
 */
export function filterFields<T>(data: T | T[], fields: string[] | null): any {
  if (!fields) return data

  const filterObject = (obj: any) => {
    const filtered: any = {}
    fields.forEach(field => {
      if (field in obj) filtered[field] = obj[field]
    })
    return filtered
  }

  return Array.isArray(data) ? data.map(filterObject) : filterObject(data)
}

/**
 * Output data as JSON to stdout
 * @param data - Data to serialize
 */
export function outputJson(data: any): void {
  console.log(JSON.stringify(data, null, 2))
}
```

### Command Integration Pattern

```typescript
// Example: src/commands/issue/sub-issue.ts
import { parseFields, filterFields, outputJson } from '../../lib/json-output'

const listCmd = new Command('list')
  .option('--json [fields]', 'Output in JSON format with optional field selection')
  .action(async (parentStr: string, options: { json?: string | boolean, repo?: string }) => {
    const parentNumber = parseInt(parentStr, 10)
    const { owner, repo } = await getRepoInfo(options.repo)

    // Fetch data (existing logic)
    const parentNodeId = await getIssueNodeId(owner, repo, parentNumber)
    const subIssues = await listSubIssues(parentNodeId)

    // JSON output mode
    if (options.json !== undefined) {
      const fields = parseFields(options.json)
      const data = subIssues.map(issue => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        nodeId: issue.nodeId,
        url: `https://github.com/${owner}/${repo}/issues/${issue.number}`
      }))
      const output = filterFields(data, fields)
      outputJson(output)
      return  // Exit early, skip human output
    }

    // Human-readable output (existing code)
    const lang = detectSystemLanguage()
    const msg = getIssueMessages(lang)
    console.log(msg.foundSubIssues(subIssues.length))
    // ... rest of existing output
  })
```

### Field Definitions

Each command defines standard fields:

| Command | Available Fields |
|---------|-----------------|
| `sub-issue list` | `number`, `title`, `state`, `nodeId`, `url` |
| `dependency list` | `number`, `title`, `state`, `nodeId`, `url` |
| `thread list` | `nodeId`, `isResolved`, `path`, `line`, `resolvedBy`, `firstCommentBody`, `url` |
| `comment list` | `id`, `body`, `author`, `createdAt`, `updatedAt`, `url` |
| `review comment list` | `id`, `body`, `author`, `path`, `line`, `createdAt`, `updatedAt`, `url` |

## Testing Strategy

### Unit Tests

```typescript
// test/lib/json-output.test.ts
describe('json-output', () => {
  describe('parseFields', () => {
    test('returns null for boolean true', () => {
      expect(parseFields(true)).toBeNull()
    })

    test('parses comma-separated string', () => {
      expect(parseFields('number,title,state')).toEqual(['number', 'title', 'state'])
    })

    test('trims whitespace', () => {
      expect(parseFields('  number , title  ')).toEqual(['number', 'title'])
    })
  })

  describe('filterFields', () => {
    test('returns all data when fields is null', () => {
      const data = [{ a: 1, b: 2 }]
      expect(filterFields(data, null)).toEqual(data)
    })

    test('filters array of objects', () => {
      const data = [{ a: 1, b: 2, c: 3 }]
      expect(filterFields(data, ['a', 'c'])).toEqual([{ a: 1, c: 3 }])
    })

    test('filters single object', () => {
      const data = { a: 1, b: 2, c: 3 }
      expect(filterFields(data, ['a'])).toEqual({ a: 1 })
    })
  })

  describe('outputJson', () => {
    test('outputs formatted JSON to stdout', () => {
      const spy = vi.spyOn(console, 'log')
      outputJson({ foo: 'bar' })
      expect(spy).toHaveBeenCalledWith('{\n  "foo": "bar"\n}')
      spy.mockRestore()
    })
  })
})
```

### Integration Tests

```typescript
// test/commands/issue/sub-issue.test.ts
describe('sub-issue list --json', () => {
  test('outputs valid JSON array', async () => {
    const output = await runCommand(['issue', 'sub-issue', 'list', '123', '--json'])
    const parsed = JSON.parse(output)

    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(3)
    expect(parsed[0]).toMatchObject({
      number: expect.any(Number),
      title: expect.any(String),
      state: expect.stringMatching(/^(OPEN|CLOSED)$/),
      nodeId: expect.any(String),
      url: expect.stringMatching(/^https:\/\/github\.com/)
    })
  })

  test('filters fields with --json number,title', async () => {
    const output = await runCommand(['issue', 'sub-issue', 'list', '123', '--json', 'number,title'])
    const parsed = JSON.parse(output)

    expect(Object.keys(parsed[0])).toEqual(['number', 'title'])
  })

  test('can be piped to jq', async () => {
    const result = await runShellCommand(
      'gh please issue sub-issue list 123 --json | jq ".[].number"'
    )
    expect(result.stdout).toContain('124')
  })
})
```

## Consequences

### Positive

✅ **GitHub CLI Compatibility**: Familiar pattern for users (`gh issue list --json`)
✅ **LLM Integration**: JSON is more accurately parsed by LLMs than Markdown/XML
✅ **Automation-Friendly**: Standard format for scripts, CI/CD, tooling
✅ **Simple Implementation**: One format, minimal complexity
✅ **Extensible**: Easy to add more fields or commands later
✅ **Tool Ecosystem**: Works with jq, python json, Node.js, etc.

### Negative

⚠️ **Not Human-Readable**: JSON is harder to read than formatted output
   - **Mitigation**: Default behavior remains human-friendly

⚠️ **Field Selection Complexity**: Requires validation logic
   - **Mitigation**: Start with all-fields mode, add selection as enhancement

### Neutral

- Default behavior unchanged (backward compatible)
- Progressive rollout (list commands first)
- Field definitions must be documented per command

## Alternatives Considered

### Option 1: Markdown/XML Output (ADR 0002)

**Rejected** because:
- LLMs handle JSON more accurately than Markdown tables
- XML is verbose and error-prone (closing tags)
- No concrete use case where Markdown/XML outperform JSON
- Added complexity for unclear benefit

See ADR 0002 rejection reason for detailed analysis.

### Option 2: Multiple Format Support (`--format json|yaml|xml`)

**Rejected** because:
- YAGNI: No demand for YAML/XML yet
- Increased maintenance burden (3+ formatters)
- Can be added later if specific use case emerges

**Decision**: Start with JSON only, add formats incrementally if needed.

### Option 3: Separate `--json` and `--fields` Flags

```bash
gh please issue sub-issue list 123 --json --fields number,title
```

**Rejected** because:
- GitHub CLI uses combined flag: `--json number,title`
- More verbose for common case (all fields)
- Inconsistent with industry standard

**Decision**: Use `--json [fields]` pattern like GitHub CLI.

## Implementation Checklist

- [x] Create ADR 0003 (this document)
- [x] Update ADR 0002 status to Rejected
- [x] Create GitHub issue (#74)
- [x] Implement `src/lib/json-output.ts`
- [x] Add tests: `test/lib/json-output.test.ts` (23 tests passing)
- [x] Update `issue sub-issue list` command
- [x] Update `issue dependency list` command
- [x] Update `pr review thread list` command
- [x] Update `issue comment list` command
- [x] Update `pr review comment list` command
- [x] Update `CLAUDE.md` with `--json` examples and field reference
- [x] Add `--json [fields]` option help text to all commands
- [ ] Add integration tests for each command (future enhancement)
- [ ] Document field selection in command --help output (future enhancement)

## Related Issues

- Implementation: #74

## References

- GitHub CLI JSON output: https://cli.github.com/manual/gh_help_formatting
- ADR 0002: LLM-Friendly Output Formats (Rejected)
- jq Manual: https://jqlang.github.io/jq/manual/
