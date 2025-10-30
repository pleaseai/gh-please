# ADR 0007: gh CLI Passthrough with TOON Format Support

**Status**: Proposed
**Date**: 2025-10-30
**Author**: Development Team

## Context

gh-please currently provides enhanced functionality for specific GitHub operations (issues, PRs, plugins) but requires explicit command registration for each feature. This creates several challenges:

1. **Limited Coverage**: Users cannot access all gh CLI features through gh-please
2. **Maintenance Burden**: Every new gh CLI feature requires manual implementation
3. **Inconsistent UX**: Users must switch between `gh` and `gh please` commands
4. **Format Inconsistency**: gh-please uses TOON format (ADR 0006), but this benefit doesn't extend to native gh commands

Additionally, with TOON format becoming the default for structured output (ADR 0006), there's an opportunity to provide consistent output formatting across all gh CLI commands when used through gh-please.

## Decision

We will implement **automatic passthrough** for all unregistered gh CLI commands with **optional TOON format conversion**.

### Core Design

#### 1. Command Resolution Priority

```
User executes: gh please <command> [args]
                     ↓
    ┌───────────────┴───────────────┐
    │  Is <command> registered?     │
    │  (issue, pr, plugin)          │
    └───────┬───────────────┬───────┘
          YES              NO
            ↓               ↓
    ┌──────────────┐  ┌──────────────┐
    │ Execute       │  │ Passthrough  │
    │ gh-please     │  │ to gh CLI    │
    │ implementation│  │              │
    └──────────────┘  └──────────────┘
```

**Registered commands take priority** over gh CLI passthrough to:
- Maintain backward compatibility
- Allow enhanced functionality (sub-issues, dependencies, TOON default)
- Enable future command overrides

#### 2. Output Format Strategy

**Default Behavior**: Preserve gh CLI's original output (human-readable tables)

**Format Conversion** (opt-in via `--format` flag):
- `--format toon`: Add `--json` to gh command → Parse JSON → Convert to TOON
- `--format json`: Add `--json` to gh command → Output JSON directly
- No flag: Pass command as-is → Preserve original output

**Rationale**:
- **Conservative approach**: Don't break existing gh CLI workflows
- **Explicit opt-in**: Users who want structured output must request it
- **Consistent with gh-please**: Matches existing `--format` flag behavior (ADR 0006)

#### 3. Implementation Architecture

```typescript
// src/lib/gh-passthrough.ts

interface PassthroughResult {
  stdout: string
  stderr: string
  exitCode: number
}

// Main passthrough orchestration
async function passThroughCommand(args: string[]): Promise<void> {
  // 1. Detect format requirement
  const { format, cleanArgs } = shouldConvertToStructuredFormat(args)

  // 2. Inject --json if format conversion needed
  const ghArgs = format ? injectJsonFlag(cleanArgs) : cleanArgs

  // 3. Execute gh CLI
  const result = await executeGhCommand(ghArgs)

  // 4. Handle errors
  if (result.exitCode !== 0) {
    process.stderr.write(result.stderr)
    process.exit(result.exitCode)
  }

  // 5. Convert format if requested
  if (format) {
    const data = JSON.parse(result.stdout)
    outputData(data, format) // from @pleaseai/cli-toolkit
  } else {
    process.stdout.write(result.stdout)
  }
}
```

**Key Components**:
1. **Format Detection**: Extract `--format` flag from args
2. **JSON Injection**: Add `--json` to gh command when conversion needed
3. **Error Preservation**: Pass through stderr and exit codes unchanged
4. **Format Conversion**: Use existing `outputData()` from cli-toolkit

#### 4. Error Handling Strategy

**Principle**: Preserve gh CLI's native error messages

**Special Cases**:
1. **JSON Parse Failure**: Show i18n message if `--json` output is invalid
2. **--json Not Supported**: Detect gh CLI error, show i18n guidance
3. **General Errors**: Pass stderr through unchanged

```typescript
// Error handling flow
try {
  const result = await executeGhCommand(ghArgs)
  if (result.exitCode !== 0) {
    // Detect --json not supported error
    if (format && result.stderr.includes('unknown flag')) {
      const msg = getPassthroughMessages(lang)
      console.error(msg.jsonNotSupported)
    } else {
      // Pass through original error
      process.stderr.write(result.stderr)
    }
    process.exit(result.exitCode)
  }
  // ... format conversion
} catch (error) {
  // JSON parse error
  const msg = getPassthroughMessages(lang)
  console.error(msg.jsonParseError)
  process.exit(1)
}
```

### Commander.js Integration

Use commander's `.action()` handler on the root program to catch unknown commands:

```typescript
// src/index.ts

// Register known commands first
program.addCommand(issueCommand())
program.addCommand(prCommand())
program.addCommand(pluginCommand())

// Fallback handler for unknown commands
program
  .allowUnknownOption()
  .action(async () => {
    const args = process.argv.slice(2)
    await passThroughCommand(args)
  })

program.parse()
```

## Consequences

### Positive

1. **Complete gh CLI Coverage**: All gh commands instantly available through gh-please
2. **Zero Maintenance**: New gh CLI features automatically supported
3. **Consistent Format**: Users can convert any gh output to TOON
4. **Backward Compatible**: Existing commands unchanged
5. **Opt-in Conversion**: Doesn't break existing workflows
6. **Simple Implementation**: ~150 LOC, reuses existing utilities

### Negative

1. **--json Detection**: Cannot determine --json support before execution
   - **Mitigation**: Detect error and show helpful message
2. **Double Command Prefix**: `gh please` instead of just `gh`
   - **Acceptable**: Users explicitly choose gh-please for enhanced features
3. **Format Flag Conflict**: If gh CLI adds `--format`, may conflict
   - **Low Risk**: gh CLI uses `--template` and `--jq` for formatting
4. **Plugin Commands**: Plugin-added commands won't passthrough
   - **Expected**: Plugins register commands before passthrough handler

### Alternatives Considered

#### Alternative 1: Explicit Command Registration

Register each gh command manually in gh-please.

**Rejected because**:
- High maintenance burden (100+ commands)
- Always behind gh CLI releases
- Violates DRY principle
- Doesn't scale

#### Alternative 2: Complete gh CLI Wrapper

Intercept all `gh` calls system-wide and inject TOON conversion.

**Rejected because**:
- Too invasive (affects other tools)
- Performance overhead
- Complex implementation
- Breaking changes for users

#### Alternative 3: TOON as Default for Passthrough

Always convert passthrough commands to TOON format.

**Rejected because**:
- Breaks existing workflows expecting table output
- Not all commands support --json
- Too opinionated
- Users lose gh CLI's rich formatting (colors, tables, progress)

#### Alternative 4: Smart --json Detection

Attempt `gh <command> --json` first to check support before execution.

**Rejected because**:
- Performance cost (2x execution for every command)
- Side effects (some commands modify state)
- Complexity
- Better to fail fast with clear error

## Implementation Plan

### Phase 1: Core Passthrough (MVP)
1. Create `src/lib/gh-passthrough.ts` with basic execution
2. Add unknown command handler to `src/index.ts`
3. Unit tests for passthrough logic

### Phase 2: Format Conversion
1. Implement format detection and flag extraction
2. Add JSON injection and TOON conversion
3. Error handling for parse failures

### Phase 3: i18n and Polish
1. Add bilingual error messages
2. E2E tests for various scenarios
3. Documentation

### Phase 4: Edge Cases
1. Handle --json not supported gracefully
2. Test with various gh commands
3. Performance validation

## Testing Strategy

### Unit Tests (`test/lib/gh-passthrough.test.ts`)
- ✅ executeGhCommand preserves stdout/stderr/exitCode
- ✅ shouldConvertToStructuredFormat detects flags correctly
- ✅ Format conversion works for toon and json
- ✅ Error handling for parse failures

### E2E Tests (`test/commands/passthrough.test.ts`)
- ✅ Registered commands take priority
- ✅ Unknown commands passthrough
- ✅ Format flag properly applied
- ✅ Exit codes preserved

### Manual Testing
```bash
# Basic passthrough
gh please repo view

# TOON conversion
gh please issue list --format toon

# JSON output
gh please pr list --format json

# Error handling
gh please invalid-command
gh please repo create --format toon  # --json not supported
```

## References

- **ADR 0006**: TOON Output Format (default for structured output)
- **ADR 0003**: JSON Output Implementation (field filtering, GitHub CLI compatibility)
- **GitHub CLI Manual**: [Output Formatting](https://cli.github.com/manual/gh_help_formatting)
- **cli-toolkit**: `@pleaseai/cli-toolkit/output` (TOON utilities)

## Open Questions

1. **Plugin Command Conflict**: What if a plugin registers a command that gh CLI also has?
   - **Answer**: Plugin commands take priority (registered before passthrough)

2. **Performance Impact**: Does passthrough add significant latency?
   - **Answer**: Negligible (<10ms) - single Bun.spawn with no overhead

3. **Version Compatibility**: Which gh CLI versions support --json?
   - **Answer**: gh CLI 2.0+ (released 2021-08-24) - safe assumption for 2025

4. **Future gh CLI Changes**: What if gh adds --format flag?
   - **Answer**: Monitor gh CLI releases, can namespace as --gh-please-format if needed
