import type { CommentInfo } from '../../src/types'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

// Mock gh command
const mockGhPath = '/tmp/mock-gh-comment-api'
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

describe('comment-api', () => {
  describe('getIssueComment', () => {
    test('should fetch issue comment by ID', async () => {
      const { getIssueComment } = await import('../../src/lib/comment-api')

      const mockComment: CommentInfo = {
        id: 123456,
        body: 'This is a test comment',
        user: { login: 'testuser' },
        html_url: 'https://github.com/owner/repo/issues/1#issuecomment-123456',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      const mockSpawn = mock((args: string[]) => {
        expect(args[0]).toBe(mockGhPath)
        expect(args[1]).toBe('api')
        expect(args).toContain('/repos/owner/repo/issues/comments/123456')

        return {
          stdout: new Response(JSON.stringify(mockComment)).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      })

      Bun.spawn = mockSpawn as any

      const result = await getIssueComment('owner', 'repo', 123456)

      expect(result).toEqual(mockComment)
      expect(mockSpawn).toHaveBeenCalledTimes(1)
    })

    test('should throw error when comment not found', async () => {
      const { getIssueComment } = await import('../../src/lib/comment-api')

      const mockSpawn = mock(() => ({
        stdout: new Response('').body,
        stderr: new Response('Not Found').body,
        exited: Promise.resolve(1),
      }))

      Bun.spawn = mockSpawn as any

      await expect(getIssueComment('owner', 'repo', 999999)).rejects.toThrow()
    })
  })

  describe('updateIssueComment', () => {
    test('should update issue comment body', async () => {
      const { updateIssueComment } = await import('../../src/lib/comment-api')

      const updatedComment: CommentInfo = {
        id: 123456,
        body: 'Updated comment text',
        user: { login: 'testuser' },
        html_url: 'https://github.com/owner/repo/issues/1#issuecomment-123456',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T01:00:00Z',
      }

      const mockSpawn = mock((args: string[]) => {
        expect(args[0]).toBe(mockGhPath)
        expect(args[1]).toBe('api')
        expect(args).toContain('--method')
        expect(args).toContain('PATCH')
        expect(args).toContain('/repos/owner/repo/issues/comments/123456')
        expect(args).toContain('-f')
        expect(args).toContain('body=Updated comment text')

        return {
          stdout: new Response(JSON.stringify(updatedComment)).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      })

      Bun.spawn = mockSpawn as any

      await updateIssueComment('owner', 'repo', 123456, 'Updated comment text')

      expect(mockSpawn).toHaveBeenCalledTimes(1)
    })

    test('should throw error when update fails', async () => {
      const { updateIssueComment } = await import('../../src/lib/comment-api')

      const mockSpawn = mock(() => ({
        stdout: new Response('').body,
        stderr: new Response('Forbidden').body,
        exited: Promise.resolve(1),
      }))

      Bun.spawn = mockSpawn as any

      await expect(
        updateIssueComment('owner', 'repo', 123456, 'New text'),
      ).rejects.toThrow()
    })
  })

  describe('getReviewComment', () => {
    test('should fetch PR review comment by ID', async () => {
      const { getReviewComment } = await import('../../src/lib/comment-api')

      const mockComment: CommentInfo = {
        id: 789012,
        body: 'Good catch!',
        user: { login: 'reviewer' },
        html_url: 'https://github.com/owner/repo/pull/10#discussion_r789012',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      const mockSpawn = mock((args: string[]) => {
        expect(args[0]).toBe(mockGhPath)
        expect(args[1]).toBe('api')
        expect(args).toContain('/repos/owner/repo/pulls/comments/789012')

        return {
          stdout: new Response(JSON.stringify(mockComment)).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      })

      Bun.spawn = mockSpawn as any

      const result = await getReviewComment('owner', 'repo', 789012)

      expect(result).toEqual(mockComment)
      expect(mockSpawn).toHaveBeenCalledTimes(1)
    })

    test('should throw error when review comment not found', async () => {
      const { getReviewComment } = await import('../../src/lib/comment-api')

      const mockSpawn = mock(() => ({
        stdout: new Response('').body,
        stderr: new Response('Not Found').body,
        exited: Promise.resolve(1),
      }))

      Bun.spawn = mockSpawn as any

      await expect(getReviewComment('owner', 'repo', 999999)).rejects.toThrow()
    })
  })

  describe('updateReviewComment', () => {
    test('should update PR review comment body', async () => {
      const { updateReviewComment } = await import('../../src/lib/comment-api')

      const updatedComment: CommentInfo = {
        id: 789012,
        body: 'Updated review comment',
        user: { login: 'reviewer' },
        html_url: 'https://github.com/owner/repo/pull/10#discussion_r789012',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T01:00:00Z',
      }

      const mockSpawn = mock((args: string[]) => {
        expect(args[0]).toBe(mockGhPath)
        expect(args[1]).toBe('api')
        expect(args).toContain('--method')
        expect(args).toContain('PATCH')
        expect(args).toContain('/repos/owner/repo/pulls/comments/789012')
        expect(args).toContain('-f')
        expect(args).toContain('body=Updated review comment')

        return {
          stdout: new Response(JSON.stringify(updatedComment)).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      })

      Bun.spawn = mockSpawn as any

      await updateReviewComment('owner', 'repo', 789012, 'Updated review comment')

      expect(mockSpawn).toHaveBeenCalledTimes(1)
    })

    test('should throw error when review comment update fails', async () => {
      const { updateReviewComment } = await import('../../src/lib/comment-api')

      const mockSpawn = mock(() => ({
        stdout: new Response('').body,
        stderr: new Response('Forbidden').body,
        exited: Promise.resolve(1),
      }))

      Bun.spawn = mockSpawn as any

      await expect(
        updateReviewComment('owner', 'repo', 789012, 'New text'),
      ).rejects.toThrow()
    })
  })

  describe('listIssueComments', () => {
    test('should list all comments for an issue', async () => {
      const { listIssueComments } = await import('../../src/lib/comment-api')

      const mockComments: CommentInfo[] = [
        {
          id: 123456,
          body: 'First comment',
          user: { login: 'user1' },
          html_url: 'https://github.com/owner/repo/issues/1#issuecomment-123456',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 123457,
          body: 'Second comment',
          user: { login: 'user2' },
          html_url: 'https://github.com/owner/repo/issues/1#issuecomment-123457',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ]

      const mockSpawn = mock((args: string[]) => {
        expect(args[0]).toBe(mockGhPath)
        expect(args[1]).toBe('api')
        expect(args).toContain('/repos/owner/repo/issues/1/comments')
        expect(args).toContain('--paginate')

        return {
          stdout: new Response(JSON.stringify(mockComments)).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      })

      Bun.spawn = mockSpawn as any

      const result = await listIssueComments('owner', 'repo', 1)

      expect(result).toEqual(mockComments)
      expect(result).toHaveLength(2)
      expect(mockSpawn).toHaveBeenCalledTimes(1)
    })

    test('should return empty array when no comments exist', async () => {
      const { listIssueComments } = await import('../../src/lib/comment-api')

      const mockSpawn = mock(() => ({
        stdout: new Response(JSON.stringify([])).body,
        stderr: new Response('').body,
        exited: Promise.resolve(0),
      }))

      Bun.spawn = mockSpawn as any

      const result = await listIssueComments('owner', 'repo', 1)

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    test('should throw error when listing fails', async () => {
      const { listIssueComments } = await import('../../src/lib/comment-api')

      const mockSpawn = mock(() => ({
        stdout: new Response('').body,
        stderr: new Response('Not Found').body,
        exited: Promise.resolve(1),
      }))

      Bun.spawn = mockSpawn as any

      await expect(listIssueComments('owner', 'repo', 999)).rejects.toThrow()
    })
  })

  describe('listReviewComments', () => {
    test('should list all review comments for a pull request', async () => {
      const { listReviewComments } = await import('../../src/lib/comment-api')

      const mockComments: CommentInfo[] = [
        {
          id: 789012,
          body: 'First review comment',
          user: { login: 'reviewer1' },
          html_url: 'https://github.com/owner/repo/pull/10#discussion_r789012',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 789013,
          body: 'Second review comment',
          user: { login: 'reviewer2' },
          html_url: 'https://github.com/owner/repo/pull/10#discussion_r789013',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ]

      const mockSpawn = mock((args: string[]) => {
        expect(args[0]).toBe(mockGhPath)
        expect(args[1]).toBe('api')
        expect(args).toContain('/repos/owner/repo/pulls/10/comments')
        expect(args).toContain('--paginate')

        return {
          stdout: new Response(JSON.stringify(mockComments)).body,
          stderr: new Response('').body,
          exited: Promise.resolve(0),
        }
      })

      Bun.spawn = mockSpawn as any

      const result = await listReviewComments('owner', 'repo', 10)

      expect(result).toEqual(mockComments)
      expect(result).toHaveLength(2)
      expect(mockSpawn).toHaveBeenCalledTimes(1)
    })

    test('should return empty array when no review comments exist', async () => {
      const { listReviewComments } = await import('../../src/lib/comment-api')

      const mockSpawn = mock(() => ({
        stdout: new Response(JSON.stringify([])).body,
        stderr: new Response('').body,
        exited: Promise.resolve(0),
      }))

      Bun.spawn = mockSpawn as any

      const result = await listReviewComments('owner', 'repo', 10)

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    test('should throw error when listing review comments fails', async () => {
      const { listReviewComments } = await import('../../src/lib/comment-api')

      const mockSpawn = mock(() => ({
        stdout: new Response('').body,
        stderr: new Response('Not Found').body,
        exited: Promise.resolve(1),
      }))

      Bun.spawn = mockSpawn as any

      await expect(listReviewComments('owner', 'repo', 999)).rejects.toThrow()
    })
  })
})
