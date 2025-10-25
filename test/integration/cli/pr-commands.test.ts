/**
 * CLI Integration Tests for PR Commands
 * Tests review-reply and resolve commands through CLI
 */

/* eslint-disable regexp/prefer-d, regexp/no-super-linear-backtracking */

import type { GhMockRule } from '../../helpers/cli-runner'
import { afterEach, beforeEach, describe, test } from 'bun:test'
import {
  createGetPrNodeIdResponse,
  createGetReviewCommentResponse,
  createListReviewThreadsResponse,
  createResolveThreadResponse,
  createReviewReplyResponse,
  ghCliResponses,
  mockPr,
  mockReviewComment,
  mockReviewThread,
} from '../../fixtures/github-responses'
import {
  assertExitCode,
  assertOutputContains,
  createGhMock,

  runCli,
  runCliExpectFailure,
  runCliExpectSuccess,
} from '../../helpers/cli-runner'

describe('PR Commands - CLI Integration', () => {
  let cleanupMock: (() => Promise<void>) | null = null
  let mockGhPath: string | null = null

  beforeEach(async () => {
    const mockRules: GhMockRule[] = [
      // Mock repo view
      {
        args: ['repo', 'view', '--json', 'owner,name'],
        response: {
          stdout: ghCliResponses.repoView,
          exitCode: 0,
        },
      },
      // Mock pr view (for deprecated review-reply command)
      {
        args: /pr view --json number,headRepositoryOwner,headRepository/,
        response: {
          stdout: ghCliResponses.currentPr,
          exitCode: 0,
        },
      },
      // Mock list all review comments (REST API - for ID conversion)
      {
        args: /api -H Accept: application\/vnd.github\+json -H X-GitHub-Api-Version: 2022-11-28 \/repos\/.*\/.*\/pulls\/[0-9]+\/comments$/,
        response: {
          stdout: JSON.stringify([
            {
              id: mockReviewComment.id,
              node_id: 'PRRC_kwDOTestNodeId',
              body: mockReviewComment.body,
              path: mockReviewComment.path,
              line: mockReviewComment.line,
              user: { login: 'test-user' },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
              html_url: `https://github.com/test-owner/test-repo/pull/${mockPr.number}#discussion_r${mockReviewComment.id}`,
            },
          ]),
          exitCode: 0,
        },
      },
      // Mock get review comment (REST API)
      {
        args: /api -H Accept: application\/vnd.github\+json -H X-GitHub-Api-Version: 2022-11-28 \/repos\/.*\/.*\/pulls\/[0-9]+\/comments\/[0-9]+/,
        response: {
          stdout: JSON.stringify(
            createGetReviewCommentResponse(
              mockReviewComment.id,
              mockReviewComment.body,
              mockPr.number,
              mockReviewComment.path,
              mockReviewComment.line,
            ),
          ),
          exitCode: 0,
        },
      },
      // Mock create review reply (REST API)
      {
        args: /api --method POST .*\/repos\/.*\/.*\/pulls\/[0-9]+\/comments\/[0-9]+\/replies -f body=/,
        response: {
          stdout: JSON.stringify(
            createReviewReplyResponse(
              999888777,
              'Reply text',
              mockReviewComment.id,
            ),
          ),
          exitCode: 0,
        },
      },
      // Mock get PR node ID (GraphQL)
      {
        args: /api graphql -f query=.*pullRequest.*-F owner=.*-F repo=.*-F number=[0-9]+/,
        response: {
          stdout: JSON.stringify(
            createGetPrNodeIdResponse(mockPr.number, mockPr.nodeId),
          ),
          exitCode: 0,
        },
      },
      // Mock list review threads (GraphQL)
      {
        args: /api graphql -f query=.*reviewThreads.*first.*-F prId=/,
        response: {
          stdout: JSON.stringify(
            createListReviewThreadsResponse([
              {
                id: mockReviewThread.id,
                isResolved: false,
                path: mockReviewThread.path,
                line: mockReviewThread.line,
              },
              {
                id: 'PRRT_kwDOABCDEF67890',
                isResolved: false,
                path: 'src/lib/api.ts',
                line: 100,
              },
            ]),
          ),
          exitCode: 0,
        },
      },
      // Mock resolve review thread (GraphQL)
      {
        args: /api graphql -f query=.*resolveReviewThread.*-F threadId=/,
        response: {
          stdout: JSON.stringify(
            createResolveThreadResponse(mockReviewThread.id),
          ),
          exitCode: 0,
        },
      },
      // Mock get thread ID from comment (GraphQL - new query)
      {
        args: /api graphql.*PullRequestReviewComment.*reviewThread.*-F commentId=/s,
        response: {
          stdout: JSON.stringify({
            data: {
              node: {
                reviewThread: {
                  id: mockReviewThread.id,
                },
              },
            },
          }),
          exitCode: 0,
        },
      },
      // Mock create review comment reply (GraphQL - new API)
      {
        args: /api graphql -f query=.*addPullRequestReviewThreadReply.*pullRequestReviewThreadId.*-F threadId=.*-F body=/,
        response: {
          stdout: JSON.stringify({
            data: {
              addPullRequestReviewThreadReply: {
                comment: {
                  id: 'PRRC_kwDOTestReplyNodeId',
                  databaseId: 999888777,
                  url: `https://github.com/test-owner/test-repo/pull/${mockPr.number}#discussion_r999888777`,
                },
              },
            },
          }),
          exitCode: 0,
        },
      },
    ]

    const { cleanup, mockPath } = await createGhMock(mockRules)
    cleanupMock = cleanup
    mockGhPath = mockPath
  })

  afterEach(async () => {
    if (cleanupMock) {
      await cleanupMock()
      cleanupMock = null
    }
  })

  describe('gh please pr review-reply (deprecated)', () => {
    test('should reply to review comment', async () => {
      const result = await runCliExpectSuccess([
        'pr',
        'review-reply',
        String(mockReviewComment.id),
        '-b',
        'Thanks for the review!',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Fetching PR information')
      assertOutputContains(result, 'Reply created successfully')
      assertOutputContains(result, 'View:')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['pr', 'review-reply', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'Deprecated', 'any')
      assertOutputContains(result, '--body')
    })

    test('should fail without --body option', async () => {
      const result = await runCliExpectFailure([
        'pr',
        'review-reply',
        String(mockReviewComment.id),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Error', 'any')
      assertOutputContains(result, 'body', 'any')
    })

    test('should fail with invalid comment ID', async () => {
      const result = await runCliExpectFailure([
        'pr',
        'review-reply',
        'not-a-number',
        '-b',
        'Test',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Error', 'any')
    })

    test('should fail with empty body', async () => {
      const result = await runCliExpectFailure([
        'pr',
        'review-reply',
        String(mockReviewComment.id),
        '-b',
        '',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Error', 'any')
    })
  })

  describe('gh please pr review thread list', () => {
    test('should list all threads with summary', async () => {
      const result = await runCliExpectSuccess([
        'pr',
        'review',
        'thread',
        'list',
        String(mockPr.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Listing review threads')
      assertOutputContains(result, 'Review Threads for PR')
      assertOutputContains(result, 'Node ID:')
      assertOutputContains(result, 'gh please pr review thread resolve')
      assertExitCode(result, 0)
    })

    test('should list only unresolved threads with --unresolved-only flag', async () => {
      const result = await runCliExpectSuccess([
        'pr',
        'review',
        'thread',
        'list',
        String(mockPr.number),
        '--unresolved-only',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Listing review threads')
      assertOutputContains(result, 'Thread')
      assertOutputContains(result, 'Node ID:')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['pr', 'review', 'thread', 'list', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'List review threads on a pull request')
      assertOutputContains(result, '--unresolved-only')
      assertOutputContains(result, '--repo')
    })

    test('should fail with invalid PR number', async () => {
      const result = await runCliExpectFailure([
        'pr',
        'review',
        'thread',
        'list',
        'not-a-number',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Error', 'any')
    })

    // Note: Additional edge cases (no threads, all resolved) are covered by unit tests
    // Integration tests focus on the happy path with mocked GitHub API
  })

  describe('gh please pr review thread resolve', () => {
    test('should resolve specific thread with --thread option', async () => {
      const result = await runCliExpectSuccess([
        'pr',
        'review',
        'thread',
        'resolve',
        String(mockPr.number),
        '--thread',
        mockReviewThread.id,
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Resolving thread')
      assertOutputContains(result, 'Thread resolved!')
      assertExitCode(result, 0)
    })

    test('should resolve all threads with --all option', async () => {
      const result = await runCliExpectSuccess([
        'pr',
        'review',
        'thread',
        'resolve',
        String(mockPr.number),
        '--all',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Fetching review threads')
      assertOutputContains(result, 'Resolving')
      assertOutputContains(result, 'thread(s)!')
      assertExitCode(result, 0)
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['pr', 'review', 'thread', 'resolve', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'Resolve review threads on a pull request')
      assertOutputContains(result, '--thread')
      assertOutputContains(result, '--all')
    })

    test('should fail without --thread or --all option', async () => {
      const result = await runCliExpectFailure([
        'pr',
        'review',
        'thread',
        'resolve',
        String(mockPr.number),
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Error', 'any')
      assertOutputContains(result, 'thread', 'any')
    })

    test('should fail with invalid PR number', async () => {
      const result = await runCliExpectFailure([
        'pr',
        'review',
        'thread',
        'resolve',
        'not-a-number',
        '--all',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Error', 'any')
    })

    test('should handle no unresolved threads gracefully', async () => {
      // Mock with no unresolved threads
      if (cleanupMock) {
        await cleanupMock()
      }

      const noThreadsMockRules: GhMockRule[] = [
        {
          args: ['repo', 'view', '--json', 'owner,name'],
          response: {
            stdout: ghCliResponses.repoView,
            exitCode: 0,
          },
        },
        {
          args: /api graphql -f query=.*pullRequest.*-F owner=.*-F repo=.*-F number=[0-9]+/,
          response: {
            stdout: JSON.stringify(
              createGetPrNodeIdResponse(mockPr.number, mockPr.nodeId),
            ),
            exitCode: 0,
          },
        },
        {
          args: /api graphql -f query=.*reviewThreads.*first.*-F prId=/,
          response: {
            stdout: JSON.stringify(
              createListReviewThreadsResponse([]),
            ),
            exitCode: 0,
          },
        },
      ]

      const { cleanup, mockPath } = await createGhMock(noThreadsMockRules)
      cleanupMock = cleanup
      mockGhPath = mockPath

      const result = await runCliExpectSuccess([
        'pr',
        'review',
        'thread',
        'resolve',
        String(mockPr.number),
        '--all',
      ], {
        env: { GH_PATH: mockGhPath },
      })

      assertOutputContains(result, 'All threads are already resolved', 'any')
      assertExitCode(result, 0)
    })
  })

  describe('gh please pr (command group)', () => {
    test('should show help when no subcommand provided', async () => {
      const result = await runCli(['pr'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Manage pull requests', 'any')
    })

    test('should show help with --help flag', async () => {
      const result = await runCliExpectSuccess(['pr', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Usage:')
      assertOutputContains(result, 'review', 'any') // New review subcommand group
      assertOutputContains(result, 'review-reply') // Deprecated
      assertOutputContains(result, 'resolve') // Deprecated
    })
  })

  describe('Deprecated review-reply command', () => {
    test('should show deprecation warning and still work', async () => {
      const result = await runCliExpectSuccess([
        'review-reply',
        String(mockReviewComment.id),
        '-b',
        'Test reply',
      ], {
        env: { GH_PATH: mockGhPath! },
      })

      // Should show deprecation warning
      assertOutputContains(result, 'Warning', 'any')
      assertOutputContains(result, 'deprecated', 'any')
      assertOutputContains(result, 'gh please pr review-reply', 'any')

      // Should still post reply successfully
      assertOutputContains(result, 'Reply created successfully', 'any')
      assertExitCode(result, 0)
    })

    test('should show help for deprecated command', async () => {
      const result = await runCliExpectSuccess(['review-reply', '--help'], {
        env: { GH_PATH: mockGhPath! },
      })

      assertOutputContains(result, 'Deprecated')
      assertOutputContains(result, 'gh please pr review-reply')
    })
  })

  describe('Error handling', () => {
    test('should handle comment not found error', async () => {
      if (cleanupMock) {
        await cleanupMock()
      }

      const errorMockRules: GhMockRule[] = [
        {
          args: ['repo', 'view', '--json', 'owner,name'],
          response: {
            stdout: ghCliResponses.repoView,
            exitCode: 0,
          },
        },
        {
          args: /api -H Accept: application\/vnd.github\+json -H X-GitHub-Api-Version: 2022-11-28 \/repos\/.*\/.*\/pulls\/[0-9]+\/comments\/[0-9]+/,
          response: {
            stderr: 'HTTP 404: Not Found',
            exitCode: 1,
          },
        },
      ]

      const { cleanup, mockPath } = await createGhMock(errorMockRules)
      cleanupMock = cleanup
      mockGhPath = mockPath

      const result = await runCliExpectFailure([
        'pr',
        'review-reply',
        '999999999',
        '-b',
        'Test',
      ], {
        env: { GH_PATH: mockGhPath },
      })

      assertOutputContains(result, 'Error', 'any')
    })

    test('should handle PR not found error', async () => {
      if (cleanupMock) {
        await cleanupMock()
      }

      const errorMockRules: GhMockRule[] = [
        {
          args: ['repo', 'view', '--json', 'owner,name'],
          response: {
            stdout: ghCliResponses.repoView,
            exitCode: 0,
          },
        },
        {
          args: /api graphql -f query=.*pullRequest.*-F owner=.*-F repo=.*-F number=[0-9]+/,
          response: {
            stderr: 'Could not resolve to a PullRequest',
            exitCode: 1,
          },
        },
      ]

      const { cleanup, mockPath } = await createGhMock(errorMockRules)
      cleanupMock = cleanup
      mockGhPath = mockPath

      const result = await runCliExpectFailure([
        'pr',
        'resolve',
        '999999',
        '--all',
      ], {
        env: { GH_PATH: mockGhPath },
      })

      assertOutputContains(result, 'Error', 'any')
    })
  })
})
