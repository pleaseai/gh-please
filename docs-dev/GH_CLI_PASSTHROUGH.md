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
- `passThroughCommand(args)`: Main orchestration (format detection → execution → conversion → output)

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

## Related Documentation

- **User Docs (EN)**: `docs/en/features/gh-cli-passthrough.md`
- **User Docs (KO)**: `docs/ko/features/gh-cli-passthrough.md`
- **ADR**: `docs-dev/adr/0007-gh-cli-passthrough.md`
- **TOON Format**: `docs-dev/adr/0006-toon-format.md`
- **JSON Output**: `docs-dev/adr/0003-json-output.md`
