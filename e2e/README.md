# E2E Tests for gh-please

End-to-end tests that verify commands against the real GitHub API.

## Setup

### 1. Create GitHub Personal Access Token

**Important**: You must use a **Classic Personal Access Token** (not fine-grained). Fine-grained tokens do not support all GraphQL operations (e.g., sub-issue mutations).

Create a Classic token with the following scopes:
- `repo` (full repository access) - **Required** for GraphQL operations
- `read:org` (read organization data) - **Required** for sub-issue operations

Create Classic token at: https://github.com/settings/tokens/new

### 2. Create Test Repository

Create a test repository on GitHub:
- Repository name: `gh-please-e2e` (or your custom name)
- Enable GitHub Issues
- **Important**: Sub-issues feature is available for public repositories with the feature enabled

### 3. Set Environment Variables

```bash
# Required
export GITHUB_TEST_TOKEN=ghp_...    # Your GitHub PAT with 'repo' scope

# Optional (defaults shown)
export GITHUB_TEST_OWNER=pleaseai   # Repository owner
export GITHUB_TEST_REPO=gh-please-e2e  # Repository name
export E2E_SKIP_CLEANUP=false       # Set to 'true' to keep test artifacts

# For PR-specific tests (review thread, PR comments)
export GITHUB_TEST_PR=123           # Existing PR number with review comments
```

### 4. Run E2E Tests

```bash
# Run all E2E tests
bun run test:e2e

# Or directly
bun test e2e/

# Run specific test suite
bun test e2e/sub-issue.e2e.test.ts
bun test e2e/dependency.e2e.test.ts
bun test e2e/pr-review-thread.e2e.test.ts
bun test e2e/comment.e2e.test.ts
```

## Test Behavior

### What Gets Created
- Test issues with `[E2E TEST]` prefix
- Sub-issue relationships
- Issue dependencies (blocked_by)

### Automatic Cleanup
- By default, all test issues are closed after tests complete
- Set `E2E_SKIP_CLEANUP=true` to preserve artifacts for debugging

### Skipping Tests
- If `GITHUB_TEST_TOKEN` is not set, E2E tests are automatically skipped
- This allows running unit tests without E2E setup

## Troubleshooting

### HTTP 403 Errors
```
gh: Resource not accessible by personal access token (HTTP 403)
```

**Causes:**
1. Token missing `repo` scope
2. Repository doesn't have sub-issues feature enabled
3. Token doesn't have access to the test repository

**Solutions:**
1. Recreate token with `repo` scope
2. Use GitHub Enterprise repository or request beta access
3. Verify token has access to `{owner}/{repo}`

### Issue Creation Returns `undefined`
```
✓ Created blocked issue #undefined
```

**Fixed in v0.11.0**: Labels are now sent correctly as array format (`labels[]=...`)

### Tests Skip Automatically
```
⊘ Skipping E2E tests (GITHUB_TEST_TOKEN not set)
```

This is normal behavior when `GITHUB_TEST_TOKEN` is not set. Set the token to run E2E tests.

## CI/CD Integration

### GitHub Actions Manual Workflow

E2E tests are **not** run automatically in CI to avoid API rate limits and test repository pollution. Instead, use the manual workflow:

1. Go to **Actions** → **Manual E2E Tests**
2. Click **Run workflow**
3. Configure parameters (optional):
   - `test_owner`: Repository owner (default: `pleaseai`)
   - `test_repo`: Repository name (default: `gh-please-e2e`)
   - `skip_cleanup`: Keep test artifacts for debugging (default: `false`)
4. Click **Run workflow**

**Required Setup:**
- Add `GH_PLEASE_TEST_TOKEN` secret to repository settings
  - Settings → Secrets and variables → Actions → New repository secret
  - Token must have `repo` scope

**Why manual only?**
- ✅ Saves GitHub API rate limits
- ✅ Avoids test repository pollution
- ✅ Run only when needed (before releases, after major changes)
- ✅ Customizable parameters for debugging

## Test Coverage

### Sub-issue Management (sub-issue.e2e.test.ts)
- ✅ Create new sub-issue
- ✅ Add existing issue as sub-issue
- ✅ List sub-issues
- ✅ Remove sub-issue link
- ✅ Error handling (invalid parent, self-linking)

### Dependency Management (dependency.e2e.test.ts)
- ✅ Add blocked-by dependency
- ✅ Add multiple dependencies
- ✅ List dependencies
- ✅ Remove dependency
- ✅ Handle issues with no dependencies
- ✅ Error handling (invalid issue, invalid blocker)

### PR Review Thread Management (pr-review-thread.e2e.test.ts)
- ✅ List all review threads on a PR
- ✅ List only unresolved review threads
- ✅ Resolve all review threads
- ✅ Error handling (invalid PR, invalid thread ID)
- ⚠️ **Note**: Requires `GITHUB_TEST_PR` environment variable set to existing PR number

### Comment Management (comment.e2e.test.ts)
- ✅ List issue comments
- ✅ Edit issue comment
- ✅ List PR review comments
- ✅ Error handling (invalid issue, invalid PR, invalid comment ID)
- ⚠️ **Note**: PR review comment tests require `GITHUB_TEST_PR` environment variable

## Development

### Adding New E2E Tests

1. Create test file in `e2e/` directory (at project root)
2. Use `setupE2ESuite()` for setup/teardown
3. Use `E2ETestHelper` for common operations:
   - `createTestIssue()` - Create test issues
   - `getIssue()` - Fetch issue details
   - `hasComment()` - Check for comments
   - `waitFor()` - Wait for conditions

4. Use `runE2ECommand()` to execute CLI commands

Example:
```typescript
import { runE2ECommand, setupE2ESuite } from './setup'

describe('My E2E Tests', () => {
  let helper: E2ETestHelper | null = null

  beforeAll(async () => {
    helper = setupE2ESuite()
  })

  test('should do something', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()
    const issueNumber = await helper.createTestIssue('Test Issue')

    const result = await runE2ECommand([
      'issue',
      'some-command',
      String(issueNumber)
    ], config)

    expect(result.exitCode).toBe(0)
  })
})
```

## Architecture

### Files
- `setup.ts` - E2E infrastructure (config, helpers, cleanup)
- `*.e2e.test.ts` - Test suites
- `README.md` - This file

### Key Classes
- `E2EConfig` - Environment configuration
- `E2ETestHelper` - Test utilities
- `TestArtifacts` - Tracks created resources for cleanup

### Design Principles
- Tests are independent and can run in any order
- Automatic cleanup prevents test pollution
- Graceful skipping when not configured
- Clear error messages for common issues
