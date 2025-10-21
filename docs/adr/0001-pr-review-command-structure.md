# ADR 0001: PR Review Command Structure Refactoring

## Status

Proposed

## Context

The current command structure for PR review-related operations has inconsistent naming patterns:

```bash
# Current inconsistent patterns
gh please pr review-reply <comment-id>           # Hyphenated single command
gh please pr review-comment edit <comment-id>    # Hyphen + space mixed
gh please issue comment edit <comment-id>        # Space-separated subcommand

# Deprecated
gh please review-reply → gh please pr review-reply
```

### Problems

1. **Inconsistent grouping**: `review-reply` is a single hyphenated command, while `review-comment edit` uses both hyphens and spaces
2. **Unclear hierarchy**: The relationship between `review`, `comment`, `reply`, and `thread` is not immediately clear
3. **Limited extensibility**: Adding new review-related commands (e.g., `review thread list`) would be awkward with the current structure
4. **API mismatch**: GitHub REST API clearly distinguishes between review comments and replies, but our CLI structure doesn't reflect this

### GitHub API Structure

```
# PR Review Comments API
POST /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/replies
PATCH /repos/{owner}/{repo}/pulls/comments/{comment_id}
PATCH /repos/{owner}/{repo}/pulls/{pull_number}/comments/{comment_id}/reactions

# Review Threads API
GET /repos/{owner}/{repo}/pulls/{pull_number}/comments
```

The API treats:
- **Review comment** = A comment on a specific line of code in a PR
- **Reply** = A response to a review comment (forms a thread)
- **Thread** = A collection of review comments and replies

## Decision

Refactor PR review commands to use **`review` as a clear subcommand group** with consistent space-separated hierarchy:

```bash
# New structure
gh please pr review reply <comment-id>
gh please pr review comment edit <comment-id>
gh please pr review thread resolve <pr-number>

# Maintain backward compatibility
gh please pr review-reply → (deprecated, redirects to new command)
gh please pr resolve → (deprecated, redirects to new command)
gh please review-reply → (deprecated, already exists)
```

### Final Command Structure

```
gh please
├── issue
│   ├── sub-issue {create|add|remove|list}
│   ├── dependency {add|remove|list}
│   ├── develop (alias: dev)
│   ├── cleanup
│   └── comment
│       └── edit
├── pr
│   ├── review
│   │   ├── reply              # Reply to a review comment
│   │   ├── comment
│   │   │   └── edit           # Edit a review comment
│   │   └── thread
│   │       └── resolve        # Resolve review thread
│   └── ...
└── plugin {list|install|uninstall}
```

## Consequences

### Positive

1. **Clear hierarchy**: Commands are organized by conceptual grouping (review → comment/reply/thread)
2. **Consistency**: All commands use space-separated subcommands (no hyphens in command names)
3. **API alignment**: Command structure mirrors GitHub API concepts
4. **Extensibility**: Easy to add new review-related commands:
   - `gh please pr review thread list`
   - `gh please pr review comment delete`
   - `gh please pr review summary create`
5. **Symmetry**: Issue and PR commands follow similar patterns:
   - `gh please issue comment edit`
   - `gh please pr review comment edit`

### Negative

1. **Migration effort**: Existing users need to learn new command names
   - **Mitigation**: Keep deprecated commands with clear warning messages
2. **Longer commands**: `review reply` vs `review-reply` (one extra space)
   - **Mitigation**: Minimal impact, improved clarity outweighs length
3. **Documentation updates**: All examples and guides need updating
   - **Mitigation**: Can be done incrementally

### Neutral

1. **Backward compatibility**: Deprecated commands will remain functional with warnings for at least 2-3 releases
2. **i18n updates**: All language files need message updates for new command paths

## Alternatives Considered

### Option 2: Minimal Change (Keep Current + Simplify)

```bash
gh please pr review-reply <comment-id>           # Keep as-is
gh please pr comment edit <comment-id>           # Simplify: review-comment → comment
gh please pr resolve <pr-number>                 # Keep as-is
```

**Rejected because**:
- Still inconsistent (hyphens vs spaces)
- Doesn't solve extensibility problem
- Doesn't align with API concepts

### Option 3: Full Hyphenation

```bash
gh please pr review-reply <comment-id>
gh please pr review-comment-edit <comment-id>
gh please pr review-thread-resolve <pr-number>
```

**Rejected because**:
- Long, hard-to-read command names
- Doesn't support natural hierarchy (can't have `review-thread list` and `review-thread-resolve`)
- Inconsistent with industry standards (most CLIs use space-separated subcommands)

## Implementation Plan

### Phase 1: Command Structure Refactoring

1. Create `src/commands/pr/review/` directory
2. Move and refactor commands:
   - `review-reply.ts` → `review/reply.ts`
   - `review-comment-edit.ts` → `review/comment-edit.ts`
   - `resolve.ts` → `review/thread-resolve.ts`
3. Create `review/index.ts` to register subcommands

### Phase 2: Backward Compatibility

1. Keep old commands with deprecation warnings:
   ```typescript
   program.addCommand(
     new Command('review-reply')
       .description('(Deprecated) Use "gh please pr review reply" instead')
       .action(() => {
         console.warn('⚠️  "gh please pr review-reply" is deprecated.')
         console.warn('   Use "gh please pr review reply" instead.')
         // Redirect to new command
       })
   )
   ```

### Phase 3: Documentation and Testing

1. Update `CLAUDE.md` with new command structure
2. Update all usage examples in documentation
3. Update i18n messages for all languages
4. Update tests to use new command structure
5. Add migration guide to release notes

## References

- GitHub REST API Documentation: https://docs.github.com/en/rest/pulls/comments
- Commander.js Subcommands: https://github.com/tj/commander.js#commands
- Related Issue: #46
- Original implementation: #54 (comment edit commands)

## Notes

This refactoring aligns with the principle of "convention over configuration" and establishes a consistent pattern for future command additions. The `review` namespace clearly separates review-related operations from other PR commands like merge, check, etc.
