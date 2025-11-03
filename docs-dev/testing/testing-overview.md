# Testing Overview

This document provides an overview of the complete testing strategy for the gh-please extension.

## Testing Levels

The project uses a multi-level testing approach:

```
┌──────────────────────────────────────────────────────────┐
│                     Testing Pyramid                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│        ┌─────────────────────────────┐                   │
│        │    Manual Testing (E2E)     │  Slowest          │
│        │  Real GitHub Environment    │  Most Realistic   │
│        └─────────────────────────────┘                   │
│                                                           │
│           ┌────────────────────────┐                      │
│           │  E2E Tests (Optional)  │  Slow               │
│           │  Real GitHub API       │  Environment-gated  │
│           └────────────────────────┘                      │
│                                                           │
│              ┌──────────────────┐                         │
│              │ Integration Tests│  Medium Speed           │
│              │  Mocked GitHub   │  CLI Execution          │
│              └──────────────────┘                         │
│                                                           │
│                 ┌───────────┐                             │
│                 │Unit Tests │  Fastest                    │
│                 │  Isolated │  Most Coverage              │
│                 └───────────┘                             │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

## 1. Unit Tests

**Location**: `test/lib/`, `test/commands/`
**Purpose**: Test individual functions and modules in isolation
**Speed**: Fast (~100ms)
**Coverage**: 87 test cases, 135 assertions

### What's Tested
- Library functions (github-api, github-graphql, please-trigger, validation)
- Command logic (ai, issue, pr commands)
- Type definitions and schemas

### How to Run
```bash
# Run all unit tests
bun test

# Run specific category
bun test test/lib
bun test test/commands

# Run with coverage
bun test --coverage

# Watch mode for development
bun test --watch
```

## 2. Integration Tests

**Location**: `test/integration/cli/`
**Purpose**: Test actual CLI execution with mocked GitHub API
**Speed**: Medium (~2-5s)
**Mocking**: GitHub CLI (`gh`) commands mocked

### What's Tested
- Complete CLI command execution
- Command output formatting
- Error handling and user messages
- Command help and documentation
- Argument parsing and validation

### Test Files
- `ai-commands.test.ts` - AI trigger commands (triage, investigate, fix, review, apply)
- `issue-commands.test.ts` - Issue management (sub-issue, dependency)
- `pr-commands.test.ts` - PR management (review-reply, resolve)

### How to Run
```bash
# Run all integration tests
bun run test:integration

# Run specific test file
bun test test/integration/cli/ai-commands.test.ts
```

## 3. E2E Tests (Optional)

**Location**: `e2e/`
**Purpose**: Test against real GitHub API
**Speed**: Slow (~10-30s)
**Requirements**: GitHub personal access token

### What's Tested
- Real API interactions
- Actual issue/PR creation and manipulation
- GitHub GraphQL API behavior
- End-to-end workflows

### Test Files
- `setup.ts` - E2E test infrastructure and helpers
- `sub-issue.e2e.test.ts` - Sub-issue management E2E tests
- `dependency.e2e.test.ts` - Dependency management E2E tests

### Environment Variables

E2E tests only run when these are set:

```bash
# Required
GITHUB_TEST_TOKEN=ghp_...        # GitHub personal access token

# Optional
GITHUB_TEST_OWNER=gh-please-e2e  # Test repository owner
GITHUB_TEST_REPO=test-repo       # Test repository name
E2E_SKIP_CLEANUP=true           # Skip cleanup (for debugging)
```

### How to Run

```bash
# Set token and run E2E tests
export GITHUB_TEST_TOKEN=ghp_your_token_here
bun run test:e2e

# Run with cleanup skip (useful for debugging)
E2E_SKIP_CLEANUP=true bun run test:e2e

# Run specific E2E test
GITHUB_TEST_TOKEN=ghp_... bun test e2e/sub-issue.e2e.test.ts
```

**⚠️ Important Notes:**
- E2E tests create real issues in the specified repository
- Tests automatically clean up created issues (unless `E2E_SKIP_CLEANUP=true`)
- Use a dedicated test repository to avoid polluting production repos
- Tests will be skipped if `GITHUB_TEST_TOKEN` is not set

## 4. Manual Testing

**Location**: `docs/testing/manual-testing-guide.md`, `scripts/manual-test.sh`
**Purpose**: Human verification in real GitHub environment
**Speed**: Slow (~10-20 min)

### Manual Test Script

Quick automated smoke test:

```bash
# Run automated manual tests
./scripts/manual-test.sh

# The script will:
# 1. Check prerequisites (gh CLI, auth, extension)
# 2. Create test issues
# 3. Run all commands
# 4. Verify outputs
# 5. Clean up test data
```

### Manual Testing Guide

For comprehensive manual testing, follow:
- `docs/testing/manual-testing-guide.md` - Step-by-step testing instructions

## Test Scripts Summary

```bash
# Unit tests only
bun run test:unit

# Integration tests only
bun run test:integration

# E2E tests only (requires GITHUB_TEST_TOKEN)
bun run test:e2e

# All automated tests (unit + integration)
bun run test:all

# Default test (all unit tests)
bun test

# Watch mode
bun run test:watch

# Coverage report
bun run test:coverage

# Manual test script
bun run test:manual
# or
./scripts/manual-test.sh
```

## Test Infrastructure

### Helpers

**`test/helpers/cli-runner.ts`**
- `runCli()` - Execute CLI commands programmatically
- `runCliExpectSuccess()` - Assert successful execution
- `runCliExpectFailure()` - Assert failed execution
- `createGhMock()` - Mock GitHub CLI for integration tests
- `assertOutputContains()` - Assert CLI output
- Helper functions for extraction and validation

**`test/fixtures/github-responses.ts`**
- Mock GitHub REST API responses
- Mock GitHub GraphQL responses
- Common test data (issues, PRs, comments)
- Response builder functions

**`e2e/setup.ts`**
- E2E test configuration and environment gating
- Test artifact tracking and cleanup
- Helper class for E2E operations
- GitHub API interaction utilities

## Coverage Goals

| Test Type | Target Coverage | Status |
|-----------|----------------|--------|
| Unit Tests | 90%+ | ✅ 87 tests |
| Integration Tests | 80%+ | ✅ Comprehensive |
| E2E Tests | Critical paths | ✅ Sub-issue, Dependency |
| Manual Tests | All features | ✅ Guide + Script |

## CI/CD Integration

### Recommended CI Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run test:e2e
        env:
          GITHUB_TEST_TOKEN: ${{ secrets.GITHUB_TEST_TOKEN }}
          GITHUB_TEST_OWNER: gh-please-e2e
          GITHUB_TEST_REPO: test-repo
```

## Best Practices

### When to Use Each Test Type

**Unit Tests**
- ✅ Testing pure functions
- ✅ Testing validation logic
- ✅ Testing data transformations
- ✅ Testing error handling
- ❌ Testing CLI output format
- ❌ Testing GitHub API integration

**Integration Tests**
- ✅ Testing CLI command execution
- ✅ Testing command output
- ✅ Testing error messages
- ✅ Testing help text
- ✅ Testing argument parsing
- ❌ Testing actual GitHub behavior

**E2E Tests**
- ✅ Testing critical workflows
- ✅ Verifying API compatibility
- ✅ Testing actual GitHub features
- ✅ Validating assumptions
- ❌ Testing every edge case
- ❌ Frequent/rapid testing

**Manual Tests**
- ✅ Release validation
- ✅ User acceptance testing
- ✅ Exploratory testing
- ✅ UI/UX verification
- ❌ Regression testing
- ❌ Continuous integration

## Debugging Tests

### Integration Test Debugging

```bash
# Run single test with verbose output
bun test test/integration/cli/ai-commands.test.ts --verbose

# Debug CLI execution issues
# Add console.log in cli-runner.ts to see actual commands
```

### E2E Test Debugging

```bash
# Skip cleanup to inspect created issues
E2E_SKIP_CLEANUP=true bun run test:e2e

# Run single E2E test
GITHUB_TEST_TOKEN=ghp_... bun test e2e/sub-issue.e2e.test.ts

# Check created issues on GitHub
# Visit: https://github.com/<OWNER>/<REPO>/issues
```

### Manual Test Debugging

```bash
# Run manual test script with specific repo
cd your-test-repo
/path/to/gh-extension-please/scripts/manual-test.sh

# Run individual commands manually
gh please ai triage 123
gh please issue sub-issue list 100
```

## Future Enhancements

- [ ] Performance benchmarking tests
- [ ] Load testing for bulk operations
- [ ] Snapshot testing for output formatting
- [ ] Contract testing for GitHub API
- [ ] Visual regression testing (if UI added)
- [ ] Mutation testing for code quality

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [Testing Best Practices](../TESTING.md)
- [TDD Methodology](../TDD.md)
