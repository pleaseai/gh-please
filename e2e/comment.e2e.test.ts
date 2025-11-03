/**
 * E2E Tests for Comment Management (Issue & PR)
 * Tests comment operations (list, edit) against real GitHub API
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
 */

import type { E2ETestHelper } from './setup'
import { beforeAll, describe, expect, test } from 'bun:test'
import { runE2ECommand, setupE2ESuite } from './setup'

describe('Comment Management - E2E', () => {
  let helper: E2ETestHelper | null = null
  let testIssueNumber: number
  let commentId: number | null = null

  beforeAll(async () => {
    helper = setupE2ESuite()

    if (!helper) {
      return
    }

    console.log('Creating test issue...')

    testIssueNumber = await helper.createTestIssue(
      '[E2E TEST] Issue for Comment Testing',
      'This issue is used for E2E testing of comment operations',
      ['test', 'e2e'],
    )

    console.log(`✓ Created test issue #${testIssueNumber}`)
  })

  describe('Issue Comment Operations', () => {
    test('should create initial comment on issue', async () => {
      if (!helper) {
        console.log('⊘ Skipping (E2E not enabled)')
        return
      }

      const config = helper.getConfig()

      // Use gh CLI to create a comment
      const proc = Bun.spawn([
        'gh',
        'api',
        `repos/${config.testOwner}/${config.testRepo}/issues/${testIssueNumber}/comments`,
        '-f',
        'body=[E2E TEST] Initial comment for testing',
      ], {
        env: {
          ...process.env,
          GITHUB_TOKEN: config.githubToken,
        },
        stdout: 'pipe',
        stderr: 'pipe',
      })

      await proc.exited

      expect(proc.exitCode).toBe(0)

      // Extract comment ID from response
      const stdout = await new Response(proc.stdout).text()
      const response = JSON.parse(stdout)
      commentId = response.id
      expect(commentId).toBeGreaterThan(0)

      console.log(`✓ Created test comment #${commentId} on issue #${testIssueNumber}`)
    })

    test('should list comments on issue', async () => {
      if (!helper) {
        console.log('⊘ Skipping (E2E not enabled)')
        return
      }

      const config = helper.getConfig()

      const result = await runE2ECommand([
        'issue',
        'comment',
        'list',
        String(testIssueNumber),
      ], config)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatch(/comment|no comments/i)

      // Should include our test comment
      if (commentId) {
        expect(result.stdout).toContain(String(commentId))
      }

      console.log(`✓ Listed comments for issue #${testIssueNumber}`)
    })

    test('should edit issue comment', async () => {
      if (!helper || !commentId || !testIssueNumber) {
        console.log('⊘ Skipping (E2E not enabled or no comment created)')
        return
      }

      const config = helper.getConfig()
      const newBody = '[E2E TEST] Updated comment body'

      const result = await runE2ECommand([
        'issue',
        'comment',
        'edit',
        String(commentId),
        '--body',
        newBody,
        '--issue',
        String(testIssueNumber),
      ], config)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatch(/updated|edited/i)

      console.log(`✓ Edited comment #${commentId}`)

      // Verify the edit by fetching the comment
      const verifyProc = Bun.spawn([
        'gh',
        'api',
        `repos/${config.testOwner}/${config.testRepo}/issues/comments/${commentId}`,
      ], {
        env: {
          ...process.env,
          GITHUB_TOKEN: config.githubToken,
        },
        stdout: 'pipe',
        stderr: 'pipe',
      })

      await verifyProc.exited

      const verifyResult = {
        exitCode: verifyProc.exitCode,
        stdout: await new Response(verifyProc.stdout).text(),
        stderr: await new Response(verifyProc.stderr).text(),
      }

      expect(verifyResult.exitCode).toBe(0)
      const comment = JSON.parse(verifyResult.stdout)
      expect(comment.body).toBe(newBody)

      console.log(`✓ Verified comment edit`)
    })

    test('should handle errors gracefully - invalid issue number', async () => {
      if (!helper) {
        console.log('⊘ Skipping (E2E not enabled)')
        return
      }

      const config = helper.getConfig()

      const result = await runE2ECommand([
        'issue',
        'comment',
        'list',
        '999999',
      ], config)

      expect(result.exitCode).not.toBe(0)
      expect(result.stderr || result.stdout).toMatch(/error|not found/i)

      console.log('✓ Handled invalid issue number error')
    })

    test('should handle errors gracefully - invalid comment ID', async () => {
      if (!helper) {
        console.log('⊘ Skipping (E2E not enabled)')
        return
      }

      const config = helper.getConfig()

      const result = await runE2ECommand([
        'issue',
        'comment',
        'edit',
        '999999999',
        '--body',
        'Test',
      ], config)

      expect(result.exitCode).not.toBe(0)
      expect(result.stderr || result.stdout).toMatch(/error|not found/i)

      console.log('✓ Handled invalid comment ID error')
    })
  })

  describe('PR Review Comment Operations', () => {
    const testPrNumber = process.env.GITHUB_TEST_PR ? Number.parseInt(process.env.GITHUB_TEST_PR, 10) : null

    test('should list PR review comments', async () => {
      if (!helper || !testPrNumber) {
        console.log('⊘ Skipping (E2E not enabled or GITHUB_TEST_PR not set)')
        return
      }

      const config = helper.getConfig()

      const result = await runE2ECommand([
        'pr',
        'review',
        'comment',
        'list',
        String(testPrNumber),
      ], config)

      expect(result.exitCode).toBe(0)
      expect(result.stdout).toMatch(/comment|no comments/i)

      console.log(`✓ Listed review comments for PR #${testPrNumber}`)
    })

    test('should handle errors gracefully - invalid PR number', async () => {
      if (!helper) {
        console.log('⊘ Skipping (E2E not enabled)')
        return
      }

      const config = helper.getConfig()

      const result = await runE2ECommand([
        'pr',
        'review',
        'comment',
        'list',
        '999999',
      ], config)

      expect(result.exitCode).not.toBe(0)
      expect(result.stderr || result.stdout).toMatch(/error|not found/i)

      console.log('✓ Handled invalid PR number error')
    })
  })
})
