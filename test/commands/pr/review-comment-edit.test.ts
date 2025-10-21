import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

// Mock gh command
const mockGhPath = '/tmp/mock-gh-review-comment'
let originalGhPath: string | undefined

beforeEach(() => {
  originalGhPath = process.env.GH_PATH
  process.env.GH_PATH = mockGhPath
})

afterEach(() => {
  if (originalGhPath !== undefined) {
    process.env.GH_PATH = originalGhPath
  }
  else {
    delete process.env.GH_PATH
  }
})

describe('pr review-comment edit command', () => {
  test('should update review comment with --body flag', async () => {
    const { createReviewCommentEditCommand } = await import(
      '../../../src/commands/pr/review-comment-edit',
    )

    const command = createReviewCommentEditCommand()

    // Mock gh API calls
    const mockSpawn = mock((args: string[]) => {
      if (args.includes('repo') && args.includes('view')) {
        // Get repo info
        return {
          stdout: new Response(
            JSON.stringify({ owner: { login: 'testowner' }, name: 'testrepo' }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
      else if (args.includes('GET') || !args.includes('--method')) {
        // Get comment
        return {
          stdout: new Response(
            JSON.stringify({
              id: 789012,
              body: 'Old review comment',
              user: { login: 'reviewer' },
              html_url: 'https://github.com/testowner/testrepo/pull/10#discussion_r789012',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z',
            }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
      else {
        // Update comment
        return {
          stdout: new Response(
            JSON.stringify({
              id: 789012,
              body: 'Updated review comment',
              user: { login: 'reviewer' },
              html_url: 'https://github.com/testowner/testrepo/pull/10#discussion_r789012',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T01:00:00Z',
            }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
    })

    Bun.spawn = mockSpawn as any

    const consoleSpy = mock(() => {})
    console.log = consoleSpy

    await command.parseAsync(['node', 'test', '789012', '--body', 'Updated review comment'])

    expect(mockSpawn).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()
  })

  test('should require --body or --body-file', async () => {
    const { createReviewCommentEditCommand } = await import(
      '../../../src/commands/pr/review-comment-edit',
    )

    const command = createReviewCommentEditCommand()

    const mockExit = mock(() => {})
    process.exit = mockExit as any

    await command.parseAsync(['node', 'test', '789012'])

    expect(mockExit).toHaveBeenCalledWith(1)
  })

  test('should work with --repo flag', async () => {
    const { createReviewCommentEditCommand } = await import(
      '../../../src/commands/pr/review-comment-edit',
    )

    const command = createReviewCommentEditCommand()

    const mockSpawn = mock((args: string[]) => {
      if (args.includes('GET') || !args.includes('--method')) {
        // Get comment
        return {
          stdout: new Response(
            JSON.stringify({
              id: 789012,
              body: 'Old review comment',
              user: { login: 'reviewer' },
              html_url: 'https://github.com/owner/repo/pull/10#discussion_r789012',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T00:00:00Z',
            }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
      else {
        // Update comment
        return {
          stdout: new Response(
            JSON.stringify({
              id: 789012,
              body: 'Updated review comment',
              user: { login: 'reviewer' },
              html_url: 'https://github.com/owner/repo/pull/10#discussion_r789012',
              created_at: '2025-01-01T00:00:00Z',
              updated_at: '2025-01-01T01:00:00Z',
            }),
          ).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      }
    })

    Bun.spawn = mockSpawn as any

    const consoleSpy = mock(() => {})
    console.log = consoleSpy

    await command.parseAsync([
      'node',
      'test',
      '789012',
      '--repo',
      'owner/repo',
      '--body',
      'Updated',
    ])

    expect(mockSpawn).toHaveBeenCalled()
  })

  test('should validate comment ID format', async () => {
    const { createReviewCommentEditCommand } = await import(
      '../../../src/commands/pr/review-comment-edit',
    )

    const command = createReviewCommentEditCommand()

    const mockExit = mock(() => {})
    process.exit = mockExit as any

    await command.parseAsync(['node', 'test', 'invalid', '--body', 'text'])

    expect(mockExit).toHaveBeenCalledWith(1)
  })
})
