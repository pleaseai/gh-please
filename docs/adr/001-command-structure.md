# ADR 001: Command Structure and Organization

## Status

Accepted

## Context

The gh-please extension currently has only two commands (`init` and `review-reply`). We need to expand functionality to include:

1. **PleaseAI workflow triggers**: triage, investigate, fix (for issues) and review, apply (for PRs)
2. **Issue management**: sub-issue creation/management, dependency management (blocked_by)
3. **PR management**: review thread resolution, review comment replies

The challenge is to design a command structure that is:
- **Intuitive**: Easy to discover and remember
- **Scalable**: Can accommodate future features
- **Consistent**: Follows a clear pattern
- **Explicit**: Avoids ambiguity about what will be modified

## Decision

We will adopt a **grouped subcommand structure** organized by function:

```bash
gh please <group> <action> <target> [options]
```

### Command Groups

1. **`ai` group**: Commands that trigger PleaseAI bot via GitHub comments
   - `gh please ai triage <issue-number>`
   - `gh please ai investigate <issue-number>`
   - `gh please ai fix <issue-number>`
   - `gh please ai review <pr-number>`
   - `gh please ai apply <pr-number>`

2. **`issue` group**: Commands that directly manipulate GitHub issues via API
   - `gh please issue sub-issue create <parent> --title "..."`
   - `gh please issue sub-issue add <parent> <child>`
   - `gh please issue sub-issue list <parent>`
   - `gh please issue dependency add <issue> --blocked-by <blocker>`
   - `gh please issue dependency remove <issue> <blocker>`
   - `gh please issue dependency list <issue>`

3. **`pr` group**: Commands that directly manipulate PRs via API
   - `gh please pr review-reply <comment-id> -b "text"`
   - `gh please pr resolve <pr-number> [--thread <id> | --all]`

4. **Top-level commands**: Configuration and utilities
   - `gh please init`

### Key Design Decisions

#### 1. Explicit Number Required (No Auto-detection)

**Decision**: All commands require explicit issue/PR numbers as arguments.

**Rationale**:
- Prevents accidental modifications to wrong issues/PRs
- Makes command behavior predictable and testable
- Allows operating on any issue/PR, not just current context
- Simpler implementation with clearer error messages

**Alternative Considered**: Auto-detect from current branch
- **Rejected**: Too implicit, error-prone, limits flexibility

#### 2. Group by Function (`ai` vs `issue`/`pr`)

**Decision**: Separate PleaseAI triggers (`ai`) from direct API manipulation (`issue`/`pr`).

**Rationale**:
- **Clarity of intent**: `ai` commands delegate to bot, others execute immediately
- **Different execution models**:
  - `ai` commands create comments and are asynchronous
  - `issue`/`pr` commands call APIs directly and are synchronous
- **Discoverability**: `gh please ai --help` shows all bot-triggerable actions
- **Future-proof**: Easy to add new AI capabilities or direct API operations

**Alternative Considered**: Group by resource type only (`issue`/`pr`)
- **Rejected**: Mixes asynchronous bot triggers with synchronous API calls, unclear semantics

#### 3. PleaseAI Integration via Comment Triggers

**Decision**: PleaseAI commands create GitHub comments in the format `/please <action>`.

**Rationale**:
- **Simplicity**: No need for direct PleaseAI API integration
- **Transparency**: Users can see the trigger comment in GitHub UI
- **Flexibility**: PleaseAI bot configuration is independent of extension
- **Existing pattern**: Aligns with how other GitHub bots work (e.g., slash commands)

**Alternative Considered**: Direct PleaseAI API calls
- **Rejected**: Requires authentication management, API endpoint configuration, tighter coupling

#### 4. GraphQL for Sub-issues and Thread Resolution

**Decision**: Use GitHub GraphQL API for:
- Sub-issue creation and management
- Review thread resolution

**Rationale**:
- **Required**: Sub-issue relationships are only exposed via GraphQL
- **Efficiency**: GraphQL allows fetching nested data in single request
- **Modern**: GraphQL is GitHub's recommended API for new features

**REST API usage**: Issue dependencies (blocked_by) use REST API endpoints.

#### 5. Backward Compatibility for `review-reply`

**Decision**: Keep `gh please review-reply` as a deprecated alias that redirects to `gh please pr review-reply` with a warning.

**Rationale**:
- **User experience**: Existing users won't have commands break
- **Migration path**: Warning educates users about new structure
- **Low cost**: Minimal code to maintain alias

## Consequences

### Positive

- **Clear separation of concerns**: Bot triggers vs direct API calls
- **Scalable**: Easy to add new commands within existing groups
- **Explicit**: No hidden auto-detection reduces surprises
- **Discoverable**: Help text organized by logical groups
- **Flexible**: Works with any issue/PR, not just current context

### Negative

- **More typing**: `gh please pr review-reply` is longer than `gh please review-reply`
  - *Mitigation*: Most users will use shell aliases for frequent commands
- **Learning curve**: Users must understand distinction between `ai` and `issue`/`pr` groups
  - *Mitigation*: Clear documentation and help text
- **Breaking change**: Existing `review-reply` users see deprecation warning
  - *Mitigation*: Command still works, just shows warning

### Neutral

- **Explicit numbers**: Some users may prefer auto-detection for convenience
  - *Trade-off*: We prioritize safety and predictability over convenience

## Implementation Notes

1. **Commander.js structure**: Each group is a `Command` with subcommands
2. **Code organization**: Mirror command structure in `src/commands/` directory
3. **Shared utilities**: GraphQL/REST clients in `src/lib/`
4. **Type safety**: TypeScript types for all API interactions
5. **Error handling**: Clear, actionable error messages for common failures

## References

- GitHub GraphQL API: https://docs.github.com/en/graphql
- GitHub REST API - Issue Dependencies: https://docs.github.com/en/rest/issues/issue-dependencies
- Commander.js Documentation: https://github.com/tj/commander.js
- Existing extension code: `src/commands/review-reply.ts`, `src/lib/github-api.ts`

## Supersedes

None (first ADR for command structure)

## Related Decisions

- Future ADR: Error handling strategy
- Future ADR: Testing approach for API interactions
- Future ADR: i18n support for new commands
