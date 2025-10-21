import type { CommentInfo } from '../../src/types'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

// Mock gh command
const mockGhPath = '/tmp/mock-gh-comment-api'
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
})
