import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

// Mock gh command
const mockGhPath = '/tmp/mock-gh-issue-comment'
let originalGhPath: string | undefined
let originalSpawn: typeof Bun.spawn

beforeEach(() => {
  originalGhPath = process.env.GH_PATH
  originalSpawn = Bun.spawn
  process.env.GH_PATH = mockGhPath
})

afterEach(() => {
  if (originalGhPath !== undefined) {
    process.env.GH_PATH = originalGhPath
  }
  else {
    delete process.env.GH_PATH
  }
  Bun.spawn = originalSpawn
})

describe('issue comment edit command', () => {
  // TODO: Update these tests for GraphQL implementation (Issue #68)
  test.skip('should update issue comment with --body flag', async () => {
    const { createIssueCommentEditCommand } = await import(
      '../../../src/commands/issue/comment-edit',
    )

    const command = createIssueCommentEditCommand()

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
              id: 123456,
              body: 'Old comment',
              user: { login: 'testuser' },
              html_url: 'https://github.com/testowner/testrepo/issues/1#issuecomment-123456',
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
              id: 123456,
              body: 'Updated comment',
              user: { login: 'testuser' },
              html_url: 'https://github.com/testowner/testrepo/issues/1#issuecomment-123456',
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

    await command.parseAsync(['node', 'test', '123456', '--body', 'Updated comment'])

    expect(mockSpawn).toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()
  })

  test('should require --body or --body-file', async () => {
    const { createIssueCommentEditCommand } = await import(
      '../../../src/commands/issue/comment-edit',
    )

    const command = createIssueCommentEditCommand()

    const mockExit = mock(() => {})
    process.exit = mockExit as any

    await command.parseAsync(['node', 'test', '123456'])

    expect(mockExit).toHaveBeenCalledWith(1)
  })

  test.skip('should work with --repo flag', async () => {
    const { createIssueCommentEditCommand } = await import(
      '../../../src/commands/issue/comment-edit',
    )

    const command = createIssueCommentEditCommand()

    const mockSpawn = mock((args: string[]) => {
      if (args.includes('GET') || !args.includes('--method')) {
        // Get comment
        return {
          stdout: new Response(
            JSON.stringify({
              id: 123456,
              body: 'Old comment',
              user: { login: 'testuser' },
              html_url: 'https://github.com/owner/repo/issues/1#issuecomment-123456',
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
              id: 123456,
              body: 'Updated comment',
              user: { login: 'testuser' },
              html_url: 'https://github.com/owner/repo/issues/1#issuecomment-123456',
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
      '123456',
      '--repo',
      'owner/repo',
      '--body',
      'Updated',
    ])

    expect(mockSpawn).toHaveBeenCalled()
  })

  test('should validate comment ID format', async () => {
    const { createIssueCommentEditCommand } = await import(
      '../../../src/commands/issue/comment-edit',
    )

    const command = createIssueCommentEditCommand()

    const mockExit = mock(() => {})
    process.exit = mockExit as any

    await command.parseAsync(['node', 'test', 'invalid', '--body', 'text'])

    expect(mockExit).toHaveBeenCalledWith(1)
  })
})
