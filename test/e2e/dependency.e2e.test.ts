/**
 * E2E Tests for Issue Dependency Management
 * Tests dependency (blocked_by) operations against real GitHub API
 *
 * NOTE: These tests only run when GITHUB_TEST_TOKEN is set
 * Set the following environment variables to run these tests:
 * - GITHUB_TEST_TOKEN: GitHub personal access token with 'repo' scope
 * - GITHUB_TEST_OWNER: Test repository owner (default: pleaseai)
 * - GITHUB_TEST_REPO: Test repository name (default: gh-please-e2e)
 * - E2E_SKIP_CLEANUP: Set to 'true' to skip cleanup (useful for debugging)
 *
 * REQUIREMENTS:
 * - Token must have 'repo' scope (full repository access)
 * - Test repository must have GitHub Issues enabled
 * - Repository must have sub-issues feature enabled (GitHub Enterprise or beta)
 * - If you get HTTP 403 errors, check token permissions and repository settings
 */

import type { E2ETestHelper } from './setup'
import { beforeAll, describe, expect, test } from 'bun:test'
import { runE2ECommand, setupE2ESuite } from './setup'

describe('Dependency Management - E2E', () => {
  let helper: E2ETestHelper | null = null
  let blockedIssueNumber: number
  let blockingIssue1Number: number
  let blockingIssue2Number: number

  beforeAll(async () => {
    helper = setupE2ESuite()

    if (!helper) {
      // Skip all tests if E2E is not enabled
      return
    }

    // Create test issues
    console.log('Creating test issues...')

    blockedIssueNumber = await helper.createTestIssue(
      '[E2E TEST] Blocked Issue',
      'This issue is blocked by other issues',
      ['test', 'e2e', 'blocked'],
    )

    blockingIssue1Number = await helper.createTestIssue(
      '[E2E TEST] Blocking Issue 1',
      'This issue blocks another issue',
      ['test', 'e2e', 'blocker'],
    )

    blockingIssue2Number = await helper.createTestIssue(
      '[E2E TEST] Blocking Issue 2',
      'This is another blocking issue',
      ['test', 'e2e', 'blocker'],
    )

    console.log(`✓ Created blocked issue #${blockedIssueNumber}`)
    console.log(`✓ Created blocking issue #${blockingIssue1Number}`)
    console.log(`✓ Created blocking issue #${blockingIssue2Number}`)
  })

  test('should add blocked-by dependency', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'dependency',
      'add',
      String(blockedIssueNumber),
      '--blocked-by',
      String(blockingIssue1Number),
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('blocked by')

    console.log(`✓ Added dependency: #${blockedIssueNumber} blocked by #${blockingIssue1Number}`)
  })

  test('should add multiple blocked-by dependencies', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'dependency',
      'add',
      String(blockedIssueNumber),
      '--blocked-by',
      String(blockingIssue2Number),
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('blocked by')

    console.log(`✓ Added dependency: #${blockedIssueNumber} blocked by #${blockingIssue2Number}`)
  })

  test('should list all blocked-by dependencies', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'dependency',
      'list',
      String(blockedIssueNumber),
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toMatch(/blocked by \d+ issue/i)
    expect(result.stdout).toContain(`#${blockingIssue1Number}`)
    expect(result.stdout).toContain(`#${blockingIssue2Number}`)

    console.log(`✓ Listed dependencies for #${blockedIssueNumber}`)
  })

  test('should remove blocked-by dependency', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'dependency',
      'remove',
      String(blockedIssueNumber),
      String(blockingIssue1Number),
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('no longer blocked')

    console.log(`✓ Removed dependency: #${blockedIssueNumber} no longer blocked by #${blockingIssue1Number}`)

    // Verify removal by listing again
    const listResult = await runE2ECommand([
      'issue',
      'dependency',
      'list',
      String(blockedIssueNumber),
    ], config)

    // Should not contain the removed blocker
    expect(listResult.stdout).not.toContain(`#${blockingIssue1Number}`)
    // But should still contain the other blocker
    expect(listResult.stdout).toContain(`#${blockingIssue2Number}`)
  })

  test('should handle issue with no dependencies', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    // Use one of the blocking issues which shouldn't have dependencies
    const result = await runE2ECommand([
      'issue',
      'dependency',
      'list',
      String(blockingIssue1Number),
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toMatch(/no blocking issues|0 blockers/i)

    console.log(`✓ Handled issue with no dependencies`)
  })

  test('should handle errors gracefully - invalid issue', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'dependency',
      'add',
      '999999',
      '--blocked-by',
      String(blockingIssue1Number),
    ], config)

    expect(result.exitCode).not.toBe(0)
    expect(result.stderr || result.stdout).toMatch(/error|not found/i)

    console.log('✓ Handled invalid issue error')
  })

  test('should handle errors gracefully - invalid blocker', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'issue',
      'dependency',
      'add',
      String(blockedIssueNumber),
      '--blocked-by',
      '999999',
    ], config)

    expect(result.exitCode).not.toBe(0)
    expect(result.stderr || result.stdout).toMatch(/error|not found/i)

    console.log('✓ Handled invalid blocker error')
  })

  test('should cleanup - remove remaining dependencies', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    // Remove the remaining dependency
    const result = await runE2ECommand([
      'issue',
      'dependency',
      'remove',
      String(blockedIssueNumber),
      String(blockingIssue2Number),
    ], config)

    expect(result.exitCode).toBe(0)

    console.log(`✓ Cleaned up remaining dependencies`)

    // Verify all dependencies removed
    const listResult = await runE2ECommand([
      'issue',
      'dependency',
      'list',
      String(blockedIssueNumber),
    ], config)

    expect(listResult.stdout).toMatch(/no blocking issues|0 blockers/i)
  })
})
