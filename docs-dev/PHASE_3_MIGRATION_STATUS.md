# Phase 3: Remaining Commands TOON Migration Status

## Overview

This document tracks the migration status of remaining GitHub CLI commands to TOON format support.

Related Issue: #143

## Commands with --json Support

### ✅ Completed

| Command | Status | Fields | Notes |
|---------|--------|--------|-------|
| `auth status` | ✅ Complete | `hosts` | Added in Phase 3 |

### ⏳ In Progress

_No commands currently in progress_

### 📋 Planned

| Command | --json Support | Expected Fields | Priority | Notes |
|---------|----------------|-----------------|----------|-------|
| _(none remaining with --json support)_ | - | - | - | All commands with --json support have been migrated |

## Commands without --json Support

These commands do not support the `--json` flag and will use graceful fallback (native gh CLI output).

### Action Commands (No JSON by Design)

| Command | Reason | Fallback Behavior |
|---------|--------|-------------------|
| `browse` | Opens browser | Native command execution |
| `completion` | Shell script output | Native script generation |
| `attestation verify` | Uses `--format json` (different pattern) | Not compatible with --json flag |

### Preview/Experimental Commands

| Command | Reason | Fallback Behavior |
|---------|--------|-------------------|
| `agent-task` | Preview feature | Native command execution |
| `preview` | Preview features listing | Native command execution |

### Status/Display Commands

| Command | Reason | Fallback Behavior |
|---------|--------|-------------------|
| `status` | Custom formatting | Native formatted output |

### Limited --json Support Commands

These commands have partial JSON support (specific subcommands only):

| Command | Subcommands with --json | Subcommands without --json | Status |
|---------|-------------------------|----------------------------|--------|
| `alias` | ❌ None | `list` | Native output only |
| `config` | ❌ None | `list`, `get`, `set` | Native output only |
| `extension` | ❌ None | `list`, `install`, `remove` | Native output only |
| `gpg-key` | ❌ None | `list`, `add`, `delete` | Native output only |
| `ssh-key` | ❌ None | `list`, `add`, `delete` | Native output only |

## Implementation Strategy

### For Commands with --json Support

1. **Add to field extraction script** (`scripts/update-gh-fields.ts`)
   - Add command configuration with proper test ID
   - Run `bun run update-fields` to extract fields
   - Verify fields in `src/lib/gh-fields.generated.ts`

2. **Write tests** (`test/lib/gh-passthrough.test.ts`)
   - Add field injection test in `injectJsonFlag` section
   - Verify TOON output format
   - Run `bun test test/lib/gh-passthrough.test.ts`

3. **Test manually**
   ```bash
   gh please <command> <subcommand> --format toon
   ```

4. **Document in CLAUDE.md** if needed

### For Commands without --json Support

1. **Document in script comments** (`scripts/update-gh-fields.ts`)
   - Add clear note explaining why command doesn't support --json
   - Categorize by reason (action command, custom format, etc.)

2. **Graceful fallback** (already implemented)
   - Commands without --json will fail with clear error message
   - Error message suggests trying without --format flag
   - Native gh CLI output is preserved

## Testing Checklist

For each command added:

- [ ] Command added to `scripts/update-gh-fields.ts`
- [ ] Field extraction successful (`bun run update-fields`)
- [ ] Fields present in `src/lib/gh-fields.generated.ts`
- [ ] Test added to `test/lib/gh-passthrough.test.ts`
- [ ] Tests pass (`bun test test/lib/gh-passthrough.test.ts`)
- [ ] Manual verification works (`gh please <cmd> --format toon`)
- [ ] Lint and type check pass (`bun run lint:fix && bun run type-check`)
- [ ] Changes committed with conventional commit message

## Migration Progress

### Overall Statistics

- **Total Commands Identified**: 12 command groups
- **Commands with --json**: 1 (auth status)
- **Commands without --json**: 11 (graceful fallback)
- **Completion**: 100% of commands with --json support

### Phase 3 Breakdown

#### With --json Support ✅
- [x] `auth status` - Completed

#### Without --json Support (Graceful Fallback) ✅
- [x] `alias` - Documented (no --json support)
- [x] `config` - Documented (no --json support)
- [x] `extension` - Documented (no --json support)
- [x] `gpg-key` - Documented (no --json support)
- [x] `ssh-key` - Documented (no --json support)
- [x] `browse` - Documented (action command)
- [x] `completion` - Documented (shell script output)
- [x] `status` - Documented (custom formatting)
- [x] `agent-task` - Documented (preview feature)
- [x] `preview` - Documented (preview feature)
- [x] `attestation verify` - Documented (uses --format json, not --json)

## Success Criteria

- [x] All commands with --json support output TOON by default
- [x] Clear messages for incompatible commands (already implemented in passthrough)
- [x] Graceful degradation for commands without --json (already implemented)
- [x] Complete command support matrix documented (this file)
- [x] 100% test coverage for supported commands (auth status tested)

## Timeline

- **Phase 3 Start**: 2025-11-03
- **auth status Added**: 2025-11-03
- **Estimated Completion**: 2025-11-03 (Complete)
- **Actual Completion**: 2025-11-03

## Dependencies

- ✅ Phase 1 Complete (Core commands: issue, pr, repo, release)
- ✅ Phase 2.1 Complete (GitHub Actions: workflow, run, cache)
- ✅ Phase 2.2 Complete (Additional: label, secret, variable, search)
- ✅ Phase 2.3 Complete (Codespace commands)
- ✅ Phase 3 Complete (Remaining commands with --json support)

## Next Steps

Phase 3 is now complete! All GitHub CLI commands that support the `--json` flag have been migrated to TOON format.

### Remaining Work

1. **Documentation Updates**
   - Update user-facing docs to reflect Phase 3 completion
   - Add auth status examples to command reference
   - Update migration roadmap

2. **Testing**
   - Integration tests for all Phase 3 commands
   - E2E tests for graceful fallback behavior

3. **Release**
   - Prepare release notes
   - Update CHANGELOG.md
   - Tag release

## References

- Issue: #143
- ADR: To be created (Phase 3 completion)
- Previous Phases:
  - [TOON_JMESPATH_MIGRATION.md](./TOON_JMESPATH_MIGRATION.md) - Overall migration roadmap
  - [TOON_COMMAND_REFERENCE.md](./TOON_COMMAND_REFERENCE.md) - Command reference
  - [GH_CLI_PASSTHROUGH.md](./GH_CLI_PASSTHROUGH.md) - Passthrough implementation
