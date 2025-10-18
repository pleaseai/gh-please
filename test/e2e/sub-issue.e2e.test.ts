/**
 * E2E Tests for Sub-issue Management
 * Tests sub-issue operations against real GitHub API
 *
 * NOTE: These tests only run when GITHUB_TEST_TOKEN is set
 * Set the following environment variables to run these tests:
 * - GITHUB_TEST_TOKEN: GitHub personal access token
 * - GITHUB_TEST_OWNER: Test repository owner (default: gh-please-e2e)
 * - GITHUB_TEST_REPO: Test repository name (default: test-repo)
 * - E2E_SKIP_CLEANUP: Set to 'true' to skip cleanup (useful for debugging)
 */

import type { E2ETestHelper } from './setup'
import { beforeAll, describe, expect, test } from 'bun:test'
import { runE2ECommand, setupE2ESuite } from './setup'

describe('Sub-issue Management - E2E', () => {
  let helper: E2ETestHelper | null = null
  let parentIssueNumber: number
  let childIssueNumber: number

  beforeAll(async () => {
    helper = setupE2ESuite()

    if (!helper) {
      // Skip all tests if E2E is not enabled
      return
    }

    // Create test issues
    console.log('Creating test issues...')

    parentIssueNumber = await helper.createTestIssue(
      '[E2E TEST] Parent Issue for Sub-issue Testing',
      'This issue is used for E2E testing of sub-issue management',
      ['test', 'e2e'],
    )

    childIssueNumber = await helper.createTestIssue(
      '[E2E TEST] Child Issue to be Linked',
      'This issue will be linked as a sub-issue',
      ['test', 'e2e'],
    )

    console.log(`✓ Created parent issue #${parentIssueNumber}`)
    console.log(`✓ Created child issue #${childIssueNumber}`)
  })

  test('should create a new sub-issue', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'sub-issue',
      'create',
      String(parentIssueNumber),
      '--title',
      '[E2E TEST] New Sub-issue',
      '--body',
      'Created via E2E test',
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Sub-issue')
    expect(result.stdout).toContain('created')

    // Extract created issue number from output
    const match = result.stdout.match(/#(\d+)/)
    expect(match).toBeTruthy()

    if (match) {
      const newSubIssueNumber = Number.parseInt(match[1], 10)
      helper.getArtifacts().addIssue(newSubIssueNumber)
      console.log(`✓ Created sub-issue #${newSubIssueNumber}`)

      // Verify the sub-issue was actually created
      const issue = await helper.getIssue(newSubIssueNumber)
      expect(issue.title).toBe('[E2E TEST] New Sub-issue')
      expect(issue.body).toContain('Created via E2E test')
    }
  })

  test('should add existing issue as sub-issue', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'sub-issue',
      'add',
      String(parentIssueNumber),
      String(childIssueNumber),
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('linked as sub-issue')

    console.log(`✓ Linked #${childIssueNumber} as sub-issue of #${parentIssueNumber}`)
  })

  test('should list sub-issues', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'sub-issue',
      'list',
      String(parentIssueNumber),
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Sub-issues of')
    expect(result.stdout).toContain(`#${childIssueNumber}`)

    console.log(`✓ Listed sub-issues of #${parentIssueNumber}`)
  })

  test('should remove sub-issue link', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'sub-issue',
      'remove',
      String(parentIssueNumber),
      String(childIssueNumber),
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('unlinked')

    console.log(`✓ Unlinked #${childIssueNumber} from #${parentIssueNumber}`)

    // Verify removal by listing again
    const listResult = await runE2ECommand([
      'issue',
      'sub-issue',
      'list',
      String(parentIssueNumber),
    ], config)

    // Should not contain the removed sub-issue
    expect(listResult.stdout).not.toContain(`#${childIssueNumber}`)
  })

  test('should handle errors gracefully - invalid parent issue', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'sub-issue',
      'create',
      '999999',
      '--title',
      'Test',
    ], config)

    expect(result.exitCode).not.toBe(0)
    expect(result.stderr || result.stdout).toMatch(/error|not found/i)

    console.log('✓ Handled invalid parent issue error')
  })

  test('should handle errors gracefully - self-linking', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'sub-issue',
      'add',
      String(parentIssueNumber),
      String(parentIssueNumber),
    ], config)

    expect(result.exitCode).not.toBe(0)
    expect(result.stderr || result.stdout).toMatch(/error|cannot|self/i)

    console.log('✓ Handled self-linking error')
  })
})
