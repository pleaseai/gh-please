/**
 * E2E Tests for PR Review Thread Management
 * Tests review thread operations (list, resolve) against real GitHub API
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
 * - PR must exist with review comments to test thread operations
 *
 * SETUP:
 * 1. Manually create a PR in the test repository
 * 2. Add review comments to the PR
 * 3. Set GITHUB_TEST_PR environment variable to the PR number
 * 4. Run the tests
 */

import type { E2ETestHelper } from './setup'
import { beforeAll, describe, expect, test } from 'bun:test'
import { runE2ECommand, setupE2ESuite } from './setup'

describe('PR Review Thread Management - E2E', () => {
  let helper: E2ETestHelper | null = null
  const testPrNumber = process.env.GITHUB_TEST_PR ? Number.parseInt(process.env.GITHUB_TEST_PR, 10) : null

  beforeAll(async () => {
    helper = setupE2ESuite()

    if (!helper) {
      return
    }

    if (!testPrNumber) {
      console.log('⚠ GITHUB_TEST_PR not set - skipping PR review thread tests')
      console.log('  Create a PR with review comments and set GITHUB_TEST_PR=<number>')
      return
    }

    console.log(`✓ Using test PR #${testPrNumber}`)
  })

  test('should list all review threads on a PR', async () => {
    if (!helper || !testPrNumber) {
      console.log('⊘ Skipping (E2E not enabled or GITHUB_TEST_PR not set)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'pr',
      'review',
      'thread',
      'list',
      String(testPrNumber),
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toMatch(/review thread|no threads/i)

    console.log(`✓ Listed review threads for PR #${testPrNumber}`)
  })

  test('should list only unresolved review threads', async () => {
    if (!helper || !testPrNumber) {
      console.log('⊘ Skipping (E2E not enabled or GITHUB_TEST_PR not set)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'pr',
      'review',
      'thread',
      'list',
      String(testPrNumber),
      '--unresolved-only',
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toMatch(/review thread|no unresolved threads/i)

    console.log(`✓ Listed unresolved review threads for PR #${testPrNumber}`)
  })

  test('should resolve all review threads', async () => {
    if (!helper || !testPrNumber) {
      console.log('⊘ Skipping (E2E not enabled or GITHUB_TEST_PR not set)')
      return
    }

    const config = helper.getConfig()

    // First, list threads to see if there are any
    const listResult = await runE2ECommand([
      'pr',
      'review',
      'thread',
      'list',
      String(testPrNumber),
      '--unresolved-only',
    ], config)

    if (listResult.stdout.includes('no unresolved threads')) {
      console.log('⊘ No unresolved threads to resolve')
      return
    }

    const result = await runE2ECommand([
      'pr',
      'review',
      'thread',
      'resolve',
      String(testPrNumber),
      '--all',
    ], config)

    expect(result.exitCode).toBe(0)
    expect(result.stdout).toMatch(/resolved|no threads/i)

    console.log(`✓ Resolved all review threads for PR #${testPrNumber}`)
  })

  test('should handle errors gracefully - invalid PR', async () => {
    if (!helper) {
      console.log('⊘ Skipping (E2E not enabled)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'pr',
      'review',
      'thread',
      'list',
      '999999',
    ], config)

    expect(result.exitCode).not.toBe(0)
    expect(result.stderr || result.stdout).toMatch(/error|not found/i)

    console.log('✓ Handled invalid PR error')
  })

  test('should handle errors gracefully - invalid thread ID', async () => {
    if (!helper || !testPrNumber) {
      console.log('⊘ Skipping (E2E not enabled or GITHUB_TEST_PR not set)')
      return
    }

    const config = helper.getConfig()

    const result = await runE2ECommand([
      'pr',
      'review',
      'thread',
      'resolve',
      String(testPrNumber),
      '--thread',
      'INVALID_NODE_ID',
    ], config)

    expect(result.exitCode).not.toBe(0)
    expect(result.stderr || result.stdout).toMatch(/error|invalid/i)

    console.log('✓ Handled invalid thread ID error')
  })
})
