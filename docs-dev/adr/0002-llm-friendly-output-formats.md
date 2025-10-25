# ADR 0002: LLM-Friendly Output Formats

## Status

Rejected (2025-10-25)

See ADR 0003 for the approved JSON-only approach.

## Context

The current CLI outputs are designed for human readability with emoji indicators, colored text, and natural language formatting:

```bash
$ gh please issue sub-issue list 123
🔍 Fetching sub-issues for #123...
✅ Found 3 sub-issues:
🟢 #124: Implement authentication module
🔴 #125: Add unit tests
🟢 #126: Update documentation

View: https://github.com/owner/repo/issues/123
```

### Problems

1. **LLM Parsing Difficulty**: Current output format is optimized for human reading but difficult for LLMs to parse reliably
   - Emoji indicators (🟢, 🔴, ✅) are not semantic
   - Mixed natural language and structured data
   - No consistent data extraction pattern

2. **Automation Challenges**: Building automation tools that consume gh-please output requires brittle regex parsing

3. **Multi-language Complexity**: i18n makes parsing even harder as output text varies by locale

4. **Integration Limitations**: Difficult to integrate with:
   - AI agents and assistants (Claude, ChatGPT, etc.)
   - Workflow automation tools
   - Custom scripting and data processing

### Use Cases

1. **AI Agent Workflows**: LLMs need to parse gh-please output to:
   - Understand issue relationships (sub-issues, dependencies)
   - Track PR review status and threads
   - Generate reports and summaries

2. **CI/CD Integration**: Automation scripts need structured output for:
   - Blocking dependency checks
   - Review thread verification
   - Issue status tracking

3. **Cross-tool Integration**: Connecting gh-please with other tools requires consistent, parseable output

### Industry Standards

Most modern CLIs support structured output:
- `gh` (GitHub CLI): `--json` flag for JSON output
- `kubectl`: `--output=json|yaml` for structured data
- `docker`: `--format` flag with Go templates
- `jq`: Designed for JSON processing

However, **JSON is not optimal for LLMs**:
- Less readable for humans (debugging difficulty)
- LLMs often prefer Markdown or XML for richer semantic context
- JSON loses visual/contextual information (emoji, status indicators)

## Decision

Implement **Markdown and XML output formats** with the following approach:

### Output Format Options

```bash
# Default: Human-readable (current behavior)
gh please issue sub-issue list 123

# Markdown: LLM-friendly with preserved context
gh please issue sub-issue list 123 --format markdown

# XML: Structured hierarchical data
gh please issue sub-issue list 123 --format xml
```

### Priority

1. **Markdown** (Priority 1): Best balance of human/LLM readability
2. **XML** (Priority 2): Hierarchical structure, schema validation support
3. **JSON** (Future): Can be added later if needed

### Design Principles

1. **Backward Compatibility**: Default output remains human-readable
2. **Consistency**: All commands support the same format flags
3. **Error Handling**: Errors always output to stderr in human-readable format (not structured)
4. **i18n Support**: Field names in English, optional description translation
5. **Extensibility**: Formatter architecture allows adding new formats

### Example Outputs

#### Markdown Format

```markdown
## Sub-Issues for #123: Implement Authentication System

**Total**: 3 sub-issues

| Status | Number | Title |
|--------|--------|-------|
| OPEN | #124 | Implement authentication module |
| CLOSED | #125 | Add unit tests |
| OPEN | #126 | Update documentation |

**Parent Issue**: https://github.com/owner/repo/issues/123

---
**Metadata**
- Command: `gh please issue sub-issue list`
- Repository: owner/repo
- Timestamp: 2025-10-21T10:30:00Z
```

#### XML Format

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sub-issue-list>
  <command>gh please issue sub-issue list</command>
  <repository>owner/repo</repository>
  <timestamp>2025-10-21T10:30:00Z</timestamp>

  <parent number="123" url="https://github.com/owner/repo/issues/123">
    <title>Implement Authentication System</title>
  </parent>

  <summary>
    <total>3</total>
  </summary>

  <sub-issues>
    <issue number="124" state="OPEN">
      <title>Implement authentication module</title>
      <url>https://github.com/owner/repo/issues/124</url>
    </issue>
    <issue number="125" state="CLOSED">
      <title>Add unit tests</title>
      <url>https://github.com/owner/repo/issues/125</url>
    </issue>
    <issue number="126" state="OPEN">
      <title>Update documentation</title>
      <url>https://github.com/owner/repo/issues/126</url>
    </issue>
  </sub-issues>
</sub-issue-list>
```

## Architecture

### Formatter Module Structure

```
src/lib/formatters/
├── index.ts              # Formatter factory and exports
├── types.ts              # Output data type definitions
├── base.ts               # Base formatter interface
├── human.ts              # Human-readable (wraps current output)
├── markdown.ts           # Markdown formatter
└── xml.ts                # XML formatter
```

### Type Definitions

```typescript
// src/lib/formatters/types.ts
export type OutputFormat = 'human' | 'markdown' | 'xml'

export interface Formatter {
  format: (data: OutputData) => string
}

export interface OutputData {
  command: string
  repository?: string
  timestamp: string
  data: any // Command-specific data
}

// Command-specific output types
export interface SubIssueListOutput {
  parent: { number: number, title: string, url: string }
  subIssues: Array<{ number: number, title: string, state: string, url: string }>
  total: number
}

export interface DependencyListOutput {
  issue: { number: number, title: string, url: string }
  blockers: Array<{ number: number, title: string, state: string, url: string }>
  total: number
}
```

### Formatter Factory

```typescript
// src/lib/formatters/index.ts
export function createFormatter(format: OutputFormat): Formatter {
  switch (format) {
    case 'markdown':
      return new MarkdownFormatter()
    case 'xml':
      return new XMLFormatter()
    case 'human':
    default:
      return new HumanFormatter()
  }
}
```

### Command Integration Pattern

```typescript
// Example: src/commands/issue/sub-issue.ts
import { createFormatter } from '../../lib/formatters'

const listCmd = new Command('list')
  .option('--format <type>', 'Output format: human|markdown|xml', 'human')
  .action(async (parentStr: string, options: { format?: string }) => {
    const format = (options.format || 'human') as OutputFormat
    const formatter = createFormatter(format)

    // Fetch data
    const subIssues = await listSubIssues(parentNodeId)

    // Prepare output data
    const outputData: OutputData = {
      command: 'gh please issue sub-issue list',
      repository: `${owner}/${repo}`,
      timestamp: new Date().toISOString(),
      data: {
        parent: { number: parentNumber, title: '...', url: '...' },
        subIssues: subIssues.map(s => ({ ...s, url: '...' })),
        total: subIssues.length
      }
    }

    // Format and output
    console.log(formatter.format(outputData))
  })
```

## Consequences

### Positive

1. **LLM Integration**: AI agents can reliably parse and understand command output
2. **Automation-Friendly**: Scripts can process structured data without regex
3. **Human-Readable Options**: Markdown maintains readability for debugging
4. **Flexibility**: Users choose format based on use case
5. **Extensibility**: Easy to add new formats (JSON, YAML, etc.) later
6. **Consistency**: All commands follow same output pattern

### Negative

1. **Implementation Effort**: Need to refactor all commands to use formatter pattern
   - **Mitigation**: Implement incrementally, starting with high-value commands
2. **Increased Complexity**: More code to maintain (3+ formatters)
   - **Mitigation**: Well-tested, interface-based design
3. **Output Size**: Markdown/XML outputs may be larger than human-readable
   - **Mitigation**: Not a concern for typical CLI usage

### Neutral

1. **No Breaking Changes**: Default behavior unchanged (human-readable)
2. **Testing Overhead**: Need to test output formats for all commands
3. **Documentation**: Need to document format flag usage

## Alternatives Considered

### Option 2: JSON Only

```bash
gh please issue sub-issue list 123 --json
```

**Rejected because**:
- Less readable for humans (debugging difficulty)
- LLMs prefer Markdown/XML for richer context
- GitHub CLI already provides `gh issue list --json`
- Loses visual/semantic information (status indicators, etc.)

### Option 3: YAML Support

```bash
gh please issue sub-issue list 123 --format yaml
```

**Rejected for initial implementation**:
- Similar benefits to JSON but with indentation
- Less common in LLM training data compared to Markdown/XML
- Can be added later if demand exists

### Option 4: Environment Variable Only

```bash
export GH_PLEASE_FORMAT=markdown
gh please issue sub-issue list 123
```

**Rejected as sole mechanism**:
- Less discoverable than CLI flag
- Harder to switch formats per-command
- **Decision**: Support both flag and env var, with flag taking precedence

## Implementation Plan

### Phase 1: Formatter Module (Foundation)

**Files to create**:
1. `src/lib/formatters/types.ts` - Type definitions
2. `src/lib/formatters/base.ts` - Formatter interface
3. `src/lib/formatters/index.ts` - Factory function
4. `test/lib/formatters/types.test.ts` - Type tests

**Success criteria**:
- TypeScript types compile
- Factory function creates formatter instances
- All tests pass

### Phase 2: Markdown Formatter

**Files to create**:
1. `src/lib/formatters/markdown.ts` - Implementation
2. `test/lib/formatters/markdown.test.ts` - Tests

**Features**:
- Table-based list outputs
- Metadata footer
- Status indicators (text-based: OPEN, CLOSED)
- Links and cross-references

### Phase 3: XML Formatter

**Files to create**:
1. `src/lib/formatters/xml.ts` - Implementation
2. `test/lib/formatters/xml.test.ts` - Tests

**Features**:
- Valid XML 1.0
- Hierarchical structure
- Attributes for metadata
- Schema-ready (optional XSD later)

### Phase 4: Human Formatter (Wrapper)

**Files to create**:
1. `src/lib/formatters/human.ts` - Wraps current output logic
2. `test/lib/formatters/human.test.ts` - Tests

**Purpose**: Maintain current behavior, make it swappable

### Phase 5: Command Integration

**Commands to update** (priority order):
1. `issue sub-issue list` - Most valuable for LLM workflows
2. `issue dependency list` - Blocking relationships
3. `pr review thread resolve` - Review status
4. `plugin list` - Plugin discovery
5. All other commands incrementally

**Per-command changes**:
- Add `--format` option
- Restructure output data preparation
- Call formatter.format()
- Update tests to verify all formats

### Phase 6: Documentation and Testing

1. Update `CLAUDE.md` with format flag examples
2. Add `docs/OUTPUT_FORMATS.md` guide
3. Update command help text
4. Integration tests for all formats
5. Add examples to README

## Testing Strategy

### Unit Tests
```typescript
// test/lib/formatters/markdown.test.ts
describe('MarkdownFormatter', () => {
  test('should format sub-issue list as markdown table', () => {
    const formatter = new MarkdownFormatter()
    const output = formatter.format({
      command: 'gh please issue sub-issue list',
      data: { /* ... */ }
    })
    expect(output).toContain('| Status | Number | Title |')
    expect(output).toContain('| OPEN | #124 |')
  })
})
```

### Integration Tests
```typescript
// test/integration/cli/format-output.test.ts
test('sub-issue list outputs valid markdown', async () => {
  const result = await runCLI(['issue', 'sub-issue', 'list', '123', '--format', 'markdown'])
  expect(result.stdout).toContain('## Sub-Issues for #123')
  // Validate markdown structure
})
```

### LLM Validation Tests
```typescript
// test/integration/llm/parsing.test.ts
test('LLM can extract sub-issue numbers from markdown output', () => {
  const output = '...' // markdown output
  const parsed = parseLLMFriendlyOutput(output)
  expect(parsed.subIssues).toHaveLength(3)
  expect(parsed.subIssues[0].number).toBe(124)
})
```

## References

- GitHub CLI JSON Output: https://cli.github.com/manual/gh_help_formatting
- Markdown Tables Spec: https://github.github.com/gfm/#tables-extension-
- XML 1.0 Spec: https://www.w3.org/TR/xml/
- Commander.js Options: https://github.com/tj/commander.js#options
- Related: ADR 0001 (Command Structure Refactoring)

## Notes

### Why Markdown Over JSON for LLMs?

1. **Training Data**: LLMs trained extensively on Markdown (GitHub, docs, forums)
2. **Context Preservation**: Tables, headings, and formatting provide semantic cues
3. **Human Debugging**: Developers can read Markdown output directly
4. **Hybrid Use**: Same output useful for humans AND machines

### Future Enhancements

1. **Custom Templates**: Allow users to define custom Markdown/XML templates
2. **JSON Support**: Add if users request it (low priority)
3. **Streaming Output**: For long lists, stream formatted chunks
4. **Compression**: Optional gzip for large outputs
5. **Schema Validation**: XSD for XML, JSON Schema for future JSON support

### Environment Variable Support

```bash
# Set default format via environment
export GH_PLEASE_FORMAT=markdown

# Flag overrides environment
gh please issue sub-issue list 123 --format xml  # Uses XML, not markdown
```

This provides convenience without sacrificing per-command flexibility.

## Rejection Reason (2025-10-25)

After further analysis and testing, this ADR is **rejected** in favor of a JSON-only approach (see ADR 0003).

### Key Findings

1. **LLMs handle JSON better than Markdown/XML**
   - JSON has clear key-value structure that LLMs parse accurately
   - Markdown tables require more complex reasoning to extract data
   - XML is verbose and prone to generation errors (missing closing tags)

2. **GitHub CLI compatibility**
   - Users are already familiar with `gh issue list --json`
   - Consistent UX across GitHub tooling
   - Existing tooling ecosystem (jq, python json module)

3. **Simplicity and YAGNI**
   - Markdown/XML add implementation and maintenance complexity
   - No concrete use case where Markdown/XML outperform JSON
   - Human-readable output already available (default behavior)

4. **Automation priority**
   - Primary use case is scripting and CI/CD integration
   - JSON is the de facto standard for machine-readable output
   - Field selection (`--json field1,field2`) covers most needs

### Decision

Implement `--json` flag only. If specific use cases for Markdown/XML emerge in the future, they can be added incrementally.

**Reference**: ADR 0003 - JSON Output Implementation
