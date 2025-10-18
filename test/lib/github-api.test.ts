import type { PrInfo, ReviewComment } from '../../src/types'
import { describe, expect, test } from 'bun:test'
import {
  buildGetCommentEndpoint,
  buildReplyEndpoint,
  createIssueComment,
  createPrComment,
  getRepoInfo,
  isTopLevelComment,
  parsePrInfo,
  parseRepoString,
} from '../../src/lib/github-api'

describe('github-api', () => {
  describe('parsePrInfo', () => {
    test('should parse PR info with nested objects', () => {
      const mockOutput = {
        number: 123,
        owner: { login: 'testowner' },
        repository: { name: 'testrepo' },
      }

      const result = parsePrInfo(mockOutput)

      expect(result).toEqual({
        number: 123,
        owner: 'testowner',
        repo: 'testrepo',
      })
    })

    test('should handle owner as string', () => {
      const mockOutput = {
        number: 456,
        owner: 'directowner',
        repository: 'directrepo',
      }

      const result = parsePrInfo(mockOutput)

      expect(result).toEqual({
        number: 456,
        owner: 'directowner',
        repo: 'directrepo',
      })
    })

    test('should handle mixed format', () => {
      const mockOutput = {
        number: 789,
        owner: { login: 'nestedowner' },
        repository: 'flatrepo',
      }

      const result = parsePrInfo(mockOutput)

      expect(result).toEqual({
        number: 789,
        owner: 'nestedowner',
        repo: 'flatrepo',
      })
    })
  })

  describe('buildGetCommentEndpoint', () => {
    test('should construct correct endpoint', () => {
      const prInfo: PrInfo = {
        owner: 'testowner',
        repo: 'testrepo',
        number: 123,
      }

      const endpoint = buildGetCommentEndpoint(prInfo, 456)

      expect(endpoint).toBe('/repos/testowner/testrepo/pulls/123/comments/456')
    })

    test('should handle different values', () => {
      const prInfo: PrInfo = {
        owner: 'github',
        repo: 'cli',
        number: 1,
      }

      const endpoint = buildGetCommentEndpoint(prInfo, 999999)

      expect(endpoint).toBe('/repos/github/cli/pulls/1/comments/999999')
    })
  })

  describe('buildReplyEndpoint', () => {
    test('should construct correct endpoint with /replies suffix', () => {
      const prInfo: PrInfo = {
        owner: 'testowner',
        repo: 'testrepo',
        number: 123,
      }

      const endpoint = buildReplyEndpoint(prInfo, 456)

      expect(endpoint).toBe('/repos/testowner/testrepo/pulls/123/comments/456/replies')
    })

    test('should differ from get comment endpoint', () => {
      const prInfo: PrInfo = {
        owner: 'test',
        repo: 'repo',
        number: 1,
      }

      const getEndpoint = buildGetCommentEndpoint(prInfo, 100)
      const replyEndpoint = buildReplyEndpoint(prInfo, 100)

      expect(replyEndpoint).toBe(`${getEndpoint}/replies`)
    })
  })

  describe('isTopLevelComment', () => {
    test('should identify top-level comments by line number', () => {
      const topLevelComment: ReviewComment = {
        id: 123,
        body: 'Review comment on code',
        user: { login: 'reviewer' },
        path: 'src/file.ts',
        line: 10,
        diff_hunk: '@@ -1,1 +1,1 @@',
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(isTopLevelComment(topLevelComment)).toBe(true)
    })

    test('should identify reply comments by null line', () => {
      const replyComment: ReviewComment = {
        id: 456,
        body: 'Reply to a review comment',
        user: { login: 'author' },
        path: 'src/file.ts',
        line: null,
        diff_hunk: '@@ -1,1 +1,1 @@',
        created_at: '2024-01-01T00:00:00Z',
      }

      expect(isTopLevelComment(replyComment)).toBe(false)
    })

    test('should handle line 0 as top-level', () => {
      const comment: ReviewComment = {
        id: 789,
        body: 'Comment on line 0',
        user: { login: 'user' },
        path: 'README.md',
        line: 0,
        diff_hunk: '@@ -0,0 +1,1 @@',
        created_at: '2024-01-01T00:00:00Z',
      }

      // Line 0 is still a number (not null), so it's top-level
      expect(isTopLevelComment(comment)).toBe(true)
    })
  })

  describe('getRepoInfo', () => {
    test('should export function with correct signature', () => {
      expect(typeof getRepoInfo).toBe('function')
    })
  })

  describe('createIssueComment', () => {
    test('should export function with correct signature', () => {
      expect(typeof createIssueComment).toBe('function')
    })
  })

  describe('createPrComment', () => {
    test('should export function with correct signature', () => {
      expect(typeof createPrComment).toBe('function')
    })
  })

  describe('parseRepoString', () => {
    test('should parse valid repo string with owner/repo format', () => {
      const result = parseRepoString('owner/repo')
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
      })
    })

    test('should parse repo string with hyphens and underscores', () => {
      const result = parseRepoString('my-org/my_repo')
      expect(result).toEqual({
        owner: 'my-org',
        repo: 'my_repo',
      })
    })

    test('should trim whitespace', () => {
      const result = parseRepoString('  owner/repo  ')
      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
      })
    })

    test('should throw error for invalid format without slash', () => {
      expect(() => parseRepoString('invalidrepo')).toThrow(
        'Invalid repository format: "invalidrepo". Expected format: "owner/repo"',
      )
    })

    test('should throw error for too many slashes', () => {
      expect(() => parseRepoString('owner/repo/extra')).toThrow(
        'Invalid repository format',
      )
    })

    test('should throw error for empty owner', () => {
      expect(() => parseRepoString('/repo')).toThrow(
        'Invalid repository format',
      )
    })

    test('should throw error for empty repo', () => {
      expect(() => parseRepoString('owner/')).toThrow(
        'Invalid repository format',
      )
    })

    test('should throw error for empty string', () => {
      expect(() => parseRepoString('')).toThrow(
        'Invalid repository format',
      )
    })
  })
})
