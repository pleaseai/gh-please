# Test Suite Documentation

Complete testing infrastructure for gh-please extension with unit, integration, and E2E tests.

## Directory Structure

```
test/
├── README.md                    # This file
├── commands/                    # Unit tests for commands
│   ├── ai/                     # AI command tests
│   ├── issue/                  # Issue command tests
│   └── pr/                     # PR command tests
├── lib/                        # Unit tests for library functions
│   ├── github-api.test.ts      # REST API tests
│   ├── github-graphql.test.ts  # GraphQL API tests
│   ├── please-trigger.test.ts  # Trigger helper tests
│   └── validation.test.ts      # Validation tests
├── fixtures/                   # Test data and mocks
│   ├── github-responses.ts     # Mock GitHub API responses
│   └── mock-data.ts           # Legacy mock data
├── helpers/                    # Test utilities
│   └── cli-runner.ts          # CLI execution helpers
├── integration/                # CLI integration tests
│   └── cli/                   # Full CLI command tests
│       ├── ai-commands.test.ts
│       ├── issue-commands.test.ts
│       └── pr-commands.test.ts
└── e2e/                       # End-to-end tests (optional)
    ├── setup.ts               # E2E infrastructure
    ├── sub-issue.e2e.test.ts  # Sub-issue E2E tests
    └── dependency.e2e.test.ts # Dependency E2E tests
```

## Quick Start

```bash
# Install dependencies
bun install

# Run all tests
bun test

# Run specific test levels
bun run test:unit          # Unit tests only
bun run test:integration   # Integration tests only
bun run test:e2e          # E2E tests (requires GITHUB_TEST_TOKEN)

# Run with coverage
bun run test:coverage

# Run in watch mode
bun run test:watch

# Run manual test script
bun run test:manual
```

## Test Types

### 1. Unit Tests (`test/lib/`, `test/commands/`)

Tests individual functions and modules in isolation.

**Characteristics:**
- Fast execution (~100ms total)
- No external dependencies
- Mocked GitHub API calls
- High code coverage focus

**Example:**
```typescript
test('should build correct GraphQL query', () => {
  const query = buildQuery('issue', 123)
  expect(query).toContain('issue(number: 123)')
})
```

**Run:**
```bash
bun run test:unit
```

### 2. Integration Tests (`test/integration/cli/`)

Tests actual CLI execution with mocked GitHub environment.

**Characteristics:**
- Medium speed (~2-5s total)
- Tests complete command workflows
- Mocks GitHub CLI (`gh`) responses
- Validates CLI output and error messages

**Example:**
```typescript
test('should trigger triage command', async () => {
  const result = await runCliExpectSuccess(['ai', 'triage', '123'])
  assertOutputContains(result, 'Triage request posted')
})
```

**Run:**
```bash
bun run test:integration
```

### 3. E2E Tests (`e2e/`)

Tests against real GitHub API (environment-gated).

**Characteristics:**
- Slow execution (~10-30s)
- Requires GitHub token
- Creates real GitHub issues
- Auto-cleanup after tests
- Only runs when `GITHUB_TEST_TOKEN` is set

**Setup:**
```bash
export GITHUB_TEST_TOKEN=ghp_your_token
export GITHUB_TEST_OWNER=your-test-org
export GITHUB_TEST_REPO=test-repo
```

**Run:**
```bash
bun run test:e2e
```

**Skip cleanup (for debugging):**
```bash
E2E_SKIP_CLEANUP=true bun run test:e2e
```

## Test Helpers

### CLI Runner (`test/helpers/cli-runner.ts`)

Utilities for spawning and testing CLI commands:

```typescript
import { assertOutputContains, runCli, runCliExpectSuccess } from '../helpers/cli-runner'

// Run command and get result
const result = await runCli(['ai', 'triage', '123'])

// Assert success
const result = await runCliExpectSuccess(['ai', 'triage', '123'])

// Assert output
assertOutputContains(result, 'expected text')

// Mock GitHub CLI
const cleanup = await createGhMock([
  {
    args: ['repo', 'view', '--json', 'owner,name'],
    response: { stdout: '{"owner":"test","name":"repo"}', exitCode: 0 }
  }
])
```

### Fixtures (`test/fixtures/github-responses.ts`)

Mock GitHub API responses:

```typescript
import {
  createIssueCommentResponse,
  ghCliResponses,
  mockIssue,
  mockPr,
} from '../fixtures/github-responses'

// Use pre-defined mocks
const issue = mockIssue // { number: 123, title: "Test Issue", ... }

// Create custom response
const response = createIssueCommentResponse(123, 'comment text', 456)
```

### E2E Setup (`e2e/setup.ts`)

E2E test infrastructure:

```typescript
import { E2ETestHelper, setupE2ESuite } from './setup'

let helper: E2ETestHelper | null = null

beforeAll(async () => {
  helper = setupE2ESuite()

  if (!helper) {
    // E2E tests skipped (no token)
    return
  }

  // Create test issue
  const issueNum = await helper.createTestIssue('Test Title', 'Body')

  // Auto-cleanup after tests
})

test('should work', async () => {
  if (!helper)
    return // Skip if no E2E

  const result = await runE2ECommand(['ai', 'triage', '123'], helper.getConfig())
  expect(result.exitCode).toBe(0)
})
```

## Writing Tests

### Unit Test Template

```typescript
import { describe, expect, test } from 'bun:test'

describe('Feature Name', () => {
  describe('function name', () => {
    test('should do something specific', () => {
      // Arrange
      const input = 'test'

      // Act
      const result = doSomething(input)

      // Assert
      expect(result).toBe('expected')
    })

    test('should handle errors', () => {
      expect(() => doSomething(null)).toThrow('Error message')
    })
  })
})
```

### Integration Test Template

```typescript
import { afterEach, beforeEach, describe, test } from 'bun:test'
import { createGhMock, runCliExpectSuccess } from '../../helpers/cli-runner'

describe('Command - CLI Integration', () => {
  let cleanupMock: (() => void) | null = null

  beforeEach(async () => {
    cleanupMock = await createGhMock([
      // Define mock responses
    ])
  })

  afterEach(() => {
    if (cleanupMock) {
      cleanupMock()
    }
  })

  test('should execute command', async () => {
    const result = await runCliExpectSuccess(['command', 'args'])
    assertOutputContains(result, 'expected output')
  })
})
```

### E2E Test Template

```typescript
import { beforeAll, describe, test } from 'bun:test'
import { runE2ECommand, setupE2ESuite } from './setup'

describe('Feature - E2E', () => {
  let helper: E2ETestHelper | null = null
  let testIssueNumber: number

  beforeAll(async () => {
    helper = setupE2ESuite()
    if (!helper)
      return

    testIssueNumber = await helper.createTestIssue('Test Issue')
  })

  test('should work with real API', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const result = await runE2ECommand(
      ['command', String(testIssueNumber)],
      helper.getConfig()
    )

    expect(result.exitCode).toBe(0)
  })
})
```

## Debugging Tests

### View Test Output

```bash
# Verbose output
bun test --verbose

# Run specific test file
bun test test/lib/github-api.test.ts

# Run specific test by name
bun test --test-name-pattern "should build query"
```

### Debug Integration Tests

The `createGhMock()` function creates a temporary script at `/tmp/gh-mock.sh`. To debug:

1. Add console.log in the test to see what's being mocked
2. Check the generated script: `cat /tmp/gh-mock.sh`
3. Run CLI manually with mocked gh: `PATH=/tmp:$PATH gh please ...`

### Debug E2E Tests

```bash
# Skip cleanup to inspect created issues
E2E_SKIP_CLEANUP=true bun run test:e2e

# Check created issues
# Visit: https://github.com/<OWNER>/<REPO>/issues

# Manually cleanup later
gh issue close 123 --comment "Test cleanup"
```

## Coverage Report

```bash
# Generate coverage report
bun run test:coverage

# Coverage files in .coverage/
```

## Continuous Integration

Example GitHub Actions workflow:

```yaml
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
```

## Best Practices

1. **Test Independence**: Each test should work in isolation
2. **Clear Names**: Use descriptive test names that explain what's being tested
3. **AAA Pattern**: Arrange, Act, Assert structure
4. **One Assertion**: Focus each test on one specific behavior
5. **Fast Tests**: Keep unit tests under 100ms
6. **Mock External**: Mock GitHub API calls in unit/integration tests
7. **Cleanup**: Always cleanup E2E test artifacts
8. **Environment Gate**: Use environment variables for E2E tests

## Troubleshooting

### Tests Failing with "Not Found"

The mock isn't being applied. Check:
- Mock rules match the actual command
- Path modification is working
- Mock script permissions

### E2E Tests Not Running

Check environment variables:
```bash
echo $GITHUB_TEST_TOKEN   # Should be set
gh auth status             # Should be authenticated
```

### Integration Tests Timeout

Increase timeout in test file:
```typescript
test('slow test', async () => {
  // ...
}, { timeout: 30000 }) // 30 seconds
```

## Contributing

When adding new commands:

1. Add unit tests in `test/commands/`
2. Add integration tests in `test/integration/cli/`
3. Consider E2E tests for critical workflows
4. Update mock responses in `test/fixtures/`
5. Run all tests before committing

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [Testing Overview](../docs/testing/testing-overview.md)
- [Manual Testing Guide](../docs/testing/manual-testing-guide.md)
- [Project Testing Standards](../docs/TESTING.md)
