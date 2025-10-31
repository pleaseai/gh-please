# gh CLI Passthrough

gh-please automatically supports **all** GitHub CLI commands through passthrough functionality. When a command is not explicitly registered (issue, pr, plugin), it is automatically forwarded to the native `gh` CLI.

## Key Features

- **Automatic command forwarding**: Unknown commands pass through to gh CLI
- **Optional TOON format**: Use `--format toon` to convert gh CLI JSON output to TOON format (58.9% token reduction)
- **Optional JSON format**: Use `--format json` to get structured JSON output
- **Command priority**: Registered gh-please commands take priority over passthrough
- **Error preservation**: gh CLI stderr and exit codes are preserved

## Usage Examples

```bash
# Passthrough with original gh CLI output (table format)
gh please repo view
gh please workflow list
gh please release view v1.0.0

# Convert to TOON format (requires --json support in gh command)
gh please issue list --format toon
gh please pr list --state open --format toon
gh please repo view --format toon

# Convert to JSON format
gh please workflow list --format json
gh please pr checks 123 --format json
```

## Implementation

### Core Component

**File**: `src/lib/gh-passthrough.ts`

**Key Functions**:
- `executeGhCommand(args)`: Execute gh CLI via Bun.spawn, return stdout/stderr/exitCode
- `shouldConvertToStructuredFormat(args)`: Detect --format flag, extract and inject --json
- `injectJsonFlag(args)`: Inject --json flag with command-specific fields when available
- `passThroughCommand(args)`: Main orchestration (format detection → execution → conversion → output)

### Field Injection for View and List Commands

GitHub CLI's view and list commands require explicit field specification when using `--json`:

```bash
# ❌ Fails - no fields specified
gh issue view 123 --json
gh issue list --json
gh pr list --json

# ✅ Works - fields explicitly provided
gh issue view 123 --json number,title,state,body,author
```

gh-please automatically injects fields for common view and list commands using generated field mappings:

| Command | Fields Injected |
|---------|----------------|
| `issue view` | assignees,author,body,closed,closedAt,... (19 fields) |
| `issue list` | assignees,author,body,closed,closedAt,... (20 fields) |
| `pr view` | additions,assignees,author,baseRefName,... (46 fields) |
| `pr list` | additions,assignees,author,baseRefName,... (46 fields) |
| `repo view` | name,owner,description,archivedAt,... (66 fields) |
| `release view` | (empty - no releases in test repo) |

**How it works:**

1. **Field Generation**: `scripts/update-gh-fields.ts` extracts available fields from `gh` CLI
2. **Field Storage**: Fields stored in `src/lib/gh-fields.generated.ts` as TypeScript constants
3. **Field Injection**: `injectJsonFlag()` appends `--json <fields>` based on command type
4. **Both view and list commands**: Both types require explicit field specification

**Example:**

```typescript
// User input
['issue', 'view', '123', '--format', 'toon']

// After format detection and field injection
['issue', 'view', '123', '--json', 'assignees,author,body,...']
```

**Updating fields:**

When GitHub CLI is updated, run:

```bash
bun run update-fields
```

See `docs-dev/GH_FIELDS_MAINTENANCE.md` for detailed maintenance instructions.

### Integration Point

**File**: `src/index.ts`

- Unknown command handler added via `.action()` on root program
- Executes after all registered commands (issue, pr, plugin)
- Uses `allowUnknownOption()` to prevent commander.js from throwing errors

### i18n Support

**File**: `src/lib/i18n.ts`

- `PassthroughMessages` interface for bilingual error messages
- `jsonParseError`: "Failed to parse JSON output" / "JSON 출력을 파싱할 수 없습니다"
- `jsonNotSupported`: "This command does not support structured output" / "이 명령어는 구조화된 출력을 지원하지 않습니다"

## Design Decisions

See **ADR 0007** (`docs-dev/adr/0007-gh-cli-passthrough.md`) for detailed rationale.

### 1. Conservative Format Strategy

Default to gh CLI's original output (tables, colors):
- Opt-in format conversion via explicit `--format` flag
- Preserves gh CLI's rich formatting and user experience

### 2. Command Priority

Registered commands always take precedence:
- Maintains backward compatibility
- Allows enhanced functionality (sub-issues, TOON defaults, dependencies)

### 3. Error Handling

Pass through gh CLI errors unchanged:
- Special handling for --json not supported (i18n message)
- JSON parse failures show helpful error messages

### 4. No Pre-validation

Don't check --json support before execution:
- Avoids double execution overhead
- Fail fast with clear error messages

## Limitations

1. **--json Support Required**: Format conversion only works with commands that support `--json` flag
2. **Plugin Commands**: Commands registered by plugins are not passthrough
3. **Interactive Commands**: Interactive commands work but cannot be converted to structured formats
4. **Exit Code Preservation**: Non-zero exits from gh CLI will stop execution

## Testing

### Unit Tests

**File**: `test/lib/gh-passthrough.test.ts`

- executeGhCommand stdout/stderr/exitCode preservation
- shouldConvertToStructuredFormat flag detection
- Format conversion (TOON and JSON)
- Error handling (parse failures, --json not supported)

### E2E Tests

**File**: `test/commands/passthrough.test.ts`

- Registered command priority verification
- Unknown command passthrough execution
- Format flag application
- Exit code preservation
- Bilingual error messages

## Troubleshooting

### Field-Related Errors

**Error: "Specify one or more comma-separated fields"**

```bash
gh please issue view 123 --format toon
# Error: Specify one or more comma-separated fields for --json...
```

**Cause**: Field mapping not found for the command.

**Solution**:
1. Run `bun run update-fields` to update field definitions
2. Check if command is in `src/lib/gh-fields.generated.ts`
3. If command is new, add it to `scripts/update-gh-fields.ts` command list

**Error: "This command does not support structured output"**

```bash
gh please <command> --format toon
# Error: This command does not support --json
```

**Cause**: The gh CLI command doesn't support `--json` flag.

**Solution**:
- Remove `--format` flag to see original output
- Check if command supports `--json`: `gh <command> --help`
- Not all gh commands support JSON output

**Error: "Failed to parse JSON output"**

```bash
gh please <command> --format toon
# Error: Failed to parse JSON output
```

**Cause**: JSON output from gh CLI is malformed or empty.

**Solution**:
1. Test without format flag: `gh please <command>` (see raw output)
2. Test with gh directly: `gh <command> --json`
3. Check for authentication issues: `gh auth status`
4. Verify the resource exists (issue/PR number, etc.)

### Field Maintenance

**When to update field definitions:**
- After upgrading GitHub CLI: `gh upgrade`
- When new commands are added to gh-please
- Weekly automated workflow detects changes

**How to update:**
```bash
bun run update-fields
git diff src/lib/gh-fields.generated.ts  # Review changes
git add src/lib/gh-fields.generated.ts
git commit -m "chore: update gh CLI field definitions"
```

See `docs-dev/GH_FIELDS_MAINTENANCE.md` for comprehensive maintenance guide.

## Related Documentation

- **User Docs (EN)**: `docs/en/features/gh-cli-passthrough.md`
- **User Docs (KO)**: `docs/ko/features/gh-cli-passthrough.md`
- **ADR**: `docs-dev/adr/0007-gh-cli-passthrough.md`
- **TOON Format**: `docs-dev/adr/0006-toon-format.md`
- **JSON Output**: `docs-dev/adr/0003-json-output.md`
- **Field Maintenance**: `docs-dev/GH_FIELDS_MAINTENANCE.md`
