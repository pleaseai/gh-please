/**
 * CLI Integration Tests for AI Commands
 * Tests actual CLI execution with mocked GitHub API responses
 */

import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  assertExitCode,
  assertOutputContains,
  createGhMock,
  runCli,
  runCliExpectFailure,
  runCliExpectSuccess,
  type GhMockRule,
} from '../../helpers/cli-runner'
import {
  createIssueCommentResponse,
  createPrCommentResponse,
  createRepoViewResponse,
  ghCliResponses,
  mockIssue,
  mockPr,
  mockRepoInfo,
} from '../../fixtures/github-responses'

describe('AI Commands - CLI Integration', () => {
  let cleanupMock: (() => void) | null = null

  beforeEach(async () => {
    // Setup mock gh CLI for all AI command tests
    const mockRules: GhMockRule[] = [
      // Mock repo view
      {
        args: ['repo', 'view', '--json', 'owner,name'],
        response: {
          stdout: ghCliResponses.repoView,
          exitCode: 0,
        },
      },
      // Mock issue comment creation (for triage, investigate, fix)
      {
        args: /api.*\/repos\/.*\/issues\/\d+\/comments/,
        response: {
          stdout: JSON.stringify(
            createIssueCommentResponse(123456, '/please [command]', mockIssue.number),
          ),
          exitCode: 0,
        },
      },
      // Mock PR comment creation (for review, apply)
      {
        args: /api.*\/repos\/.*\/issues\/\d+\/comments/,
        response: {
          stdout: JSON.stringify(
            createPrCommentResponse(234567, '/please [command]', mockPr.number),
          ),
          exitCode: 0,
        },
      },
    ]

    cleanupMock = await createGhMock(mockRules)
  })

  afterEach(() => {
    if (cleanupMock) {
      cleanupMock()
      cleanupMock = null
    }
  })

  describe('gh please ai triage', () => {
    test('should trigger triage on valid issue', async () => {
      const result = await runCliExpectSuccess(['ai', 'triage', String(mockIssue.number)])

      assertOutputContains(result, 'Triggering PleaseAI triage')
      assertOutputContains(result, `issue #${mockIssue.number}`)
      assertOutputContains(result, 'Triage request posted')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['ai', 'triage', '--help'])

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'triage')
      assertOutputContains(result, 'Trigger PleaseAI triage')
    })

    test('should fail with missing issue number', async () => {
      const result = await runCliExpectFailure(['ai', 'triage'])

      assertOutputContains(result, 'error', 'any')
      assertOutputContains(result, 'issue-number', 'any')
    })

    test('should fail with invalid issue number', async () => {
      const result = await runCliExpectFailure(['ai', 'triage', 'not-a-number'])

      assertOutputContains(result, 'error', 'any')
    })
  })

  describe('gh please ai investigate', () => {
    test('should trigger investigation on valid issue', async () => {
      const result = await runCliExpectSuccess(['ai', 'investigate', String(mockIssue.number)])

      assertOutputContains(result, 'Triggering PleaseAI investigation')
      assertOutputContains(result, `issue #${mockIssue.number}`)
      assertOutputContains(result, 'Investigation request posted')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['ai', 'investigate', '--help'])

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'investigate')
      assertOutputContains(result, 'Trigger PleaseAI investigation')
    })

    test('should fail with missing issue number', async () => {
      const result = await runCliExpectFailure(['ai', 'investigate'])

      assertOutputContains(result, 'error', 'any')
      assertOutputContains(result, 'issue-number', 'any')
    })
  })

  describe('gh please ai fix', () => {
    test('should trigger fix on valid issue', async () => {
      const result = await runCliExpectSuccess(['ai', 'fix', String(mockIssue.number)])

      assertOutputContains(result, 'Triggering PleaseAI fix')
      assertOutputContains(result, `issue #${mockIssue.number}`)
      assertOutputContains(result, 'Fix request posted')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['ai', 'fix', '--help'])

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'fix')
      assertOutputContains(result, 'Trigger PleaseAI fix')
    })

    test('should fail with missing issue number', async () => {
      const result = await runCliExpectFailure(['ai', 'fix'])

      assertOutputContains(result, 'error', 'any')
      assertOutputContains(result, 'issue-number', 'any')
    })
  })

  describe('gh please ai review', () => {
    test('should trigger review on valid PR', async () => {
      const result = await runCliExpectSuccess(['ai', 'review', String(mockPr.number)])

      assertOutputContains(result, 'Triggering PleaseAI code review')
      assertOutputContains(result, `PR #${mockPr.number}`)
      assertOutputContains(result, 'Review request posted')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['ai', 'review', '--help'])

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'review')
      assertOutputContains(result, 'Trigger PleaseAI code review')
    })

    test('should fail with missing PR number', async () => {
      const result = await runCliExpectFailure(['ai', 'review'])

      assertOutputContains(result, 'error', 'any')
      assertOutputContains(result, 'pr-number', 'any')
    })
  })

  describe('gh please ai apply', () => {
    test('should trigger apply on valid PR', async () => {
      const result = await runCliExpectSuccess(['ai', 'apply', String(mockPr.number)])

      assertOutputContains(result, 'Triggering PleaseAI apply')
      assertOutputContains(result, `PR #${mockPr.number}`)
      assertOutputContains(result, 'Apply request posted')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['ai', 'apply', '--help'])

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'apply')
      assertOutputContains(result, 'Apply PleaseAI suggestions')
    })

    test('should fail with missing PR number', async () => {
      const result = await runCliExpectFailure(['ai', 'apply'])

      assertOutputContains(result, 'error', 'any')
      assertOutputContains(result, 'pr-number', 'any')
    })
  })

  describe('gh please ai (command group)', () => {
    test('should show help when no subcommand provided', async () => {
      const result = await runCli(['ai'])

      // Commander shows help and exits with 0 or shows error
      assertOutputContains(result, 'Trigger PleaseAI workflows', 'any')
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['ai', '--help'])

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'triage')
      assertOutputContains(result, 'investigate')
      assertOutputContains(result, 'fix')
      assertOutputContains(result, 'review')
      assertOutputContains(result, 'apply')
    })

    test('should fail with unknown subcommand', async () => {
      const result = await runCliExpectFailure(['ai', 'unknown-command'])

      assertOutputContains(result, 'error', 'any')
      assertOutputContains(result, 'unknown', 'any')
    })
  })

  describe('Error handling', () => {
    test('should handle network errors gracefully', async () => {
      // Create new mock that returns error
      if (cleanupMock) {
        cleanupMock()
      }

      const errorMockRules: GhMockRule[] = [
        {
          args: ['repo', 'view', '--json', 'owner,name'],
          response: {
            stderr: 'HTTP 500: Internal Server Error',
            exitCode: 1,
          },
        },
      ]

      cleanupMock = await createGhMock(errorMockRules)

      const result = await runCliExpectFailure(['ai', 'triage', '123'])

      assertOutputContains(result, 'error', 'any')
    })

    test('should handle authentication errors', async () => {
      if (cleanupMock) {
        cleanupMock()
      }

      const authErrorMockRules: GhMockRule[] = [
        {
          args: ['repo', 'view', '--json', 'owner,name'],
          response: {
            stderr: 'HTTP 401: Bad credentials',
            exitCode: 1,
          },
        },
      ]

      cleanupMock = await createGhMock(authErrorMockRules)

      const result = await runCliExpectFailure(['ai', 'triage', '123'])

      assertOutputContains(result, 'error', 'any')
    })
  })
})
