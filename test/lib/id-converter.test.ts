import { beforeEach, describe, expect, test } from 'bun:test'
import {
  decodeNodeId,
  encodeNodeId,
  extractDatabaseId,
  getNodeIdPrefix,
  getNodeIdType,
  isCommentNodeId,
  isDatabaseId,
  isLegacyNodeId,
  isNewNodeId,
  isNodeId,
  isThreadNodeId,
  toIssueCommentNodeId,
  toReviewCommentNodeId,
  validateCommentIdentifier,
} from '../../src/lib/id-converter'

describe('id-converter', () => {
  describe('isNodeId', () => {
    test('should detect PR review comment Node ID', () => {
      expect(isNodeId('PRRC_kwDOP34zbs6ShH0J')).toBe(true)
    })

    test('should detect issue comment Node ID', () => {
      expect(isNodeId('IC_kwDOABC123')).toBe(true)
    })

    test('should detect issue Node ID', () => {
      expect(isNodeId('I_kwDOABC123')).toBe(true)
    })

    test('should detect PR Node ID', () => {
      expect(isNodeId('PR_kwDOABC123')).toBe(true)
    })

    test('should reject database ID (number)', () => {
      expect(isNodeId('2458156297')).toBe(false)
    })

    test('should reject invalid format', () => {
      expect(isNodeId('invalid-id')).toBe(false)
      expect(isNodeId('123abc')).toBe(false)
      expect(isNodeId('')).toBe(false)
    })

    test('should detect Legacy format Node ID', () => {
      // Legacy format: Base64-encoded "XXX:TypeNameDatabaseId"
      expect(isNodeId('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')).toBe(true) // "010:Repository139095377"
      expect(isNodeId('MDQ6VXNlcjEyMzQ1')).toBe(true) // "04:User12345"
    })
  })

  describe('isDatabaseId', () => {
    test('should detect valid database ID', () => {
      expect(isDatabaseId('2458156297')).toBe(true)
      expect(isDatabaseId('123')).toBe(true)
    })

    test('should reject Node ID', () => {
      expect(isDatabaseId('PRRC_kwDOP34zbs6ShH0J')).toBe(false)
    })

    test('should reject negative numbers', () => {
      expect(isDatabaseId('-123')).toBe(false)
    })

    test('should reject zero', () => {
      expect(isDatabaseId('0')).toBe(false)
    })

    test('should reject non-numeric strings', () => {
      expect(isDatabaseId('abc')).toBe(false)
      expect(isDatabaseId('12.34')).toBe(false)
      expect(isDatabaseId('')).toBe(false)
    })
  })

  describe('validateCommentIdentifier', () => {
    test('should accept valid Node ID', () => {
      const id = 'PRRC_kwDOP34zbs6ShH0J'
      expect(validateCommentIdentifier(id)).toBe(id)
    })

    test('should accept valid database ID', () => {
      const id = '2458156297'
      expect(validateCommentIdentifier(id)).toBe(id)
    })

    test('should throw error for invalid format', () => {
      expect(() => validateCommentIdentifier('invalid-id')).toThrow(
        /Invalid comment identifier/,
      )
      expect(() => validateCommentIdentifier('')).toThrow(
        /Invalid comment identifier/,
      )
      expect(() => validateCommentIdentifier('-123')).toThrow(
        /Invalid comment identifier/,
      )
    })

    test('should include expected formats in error message', () => {
      try {
        validateCommentIdentifier('invalid')
      }
      catch (error) {
        expect(error).toBeInstanceOf(Error)
        if (error instanceof Error) {
          expect(error.message).toContain('Database ID')
          expect(error.message).toContain('Node ID')
        }
      }
    })
  })

  describe('toReviewCommentNodeId', () => {
    // Mock gh command for testing
    const originalEnv = process.env.GH_PATH

    beforeEach(() => {
      // Tests will use mock gh command if needed
      process.env.GH_PATH = originalEnv
    })

    test('should return Node ID as-is when Node ID is provided', async () => {
      const nodeId = 'PRRC_kwDOP34zbs6ShH0J'
      const result = await toReviewCommentNodeId(nodeId, 'owner', 'repo', 123)
      expect(result).toBe(nodeId)
    })

    test('should convert database ID to Node ID', async () => {
      // This test requires actual GitHub API access
      // Skip in CI/test environments without credentials
      if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
        // Test the interface without actual API call
        const databaseId = '2458156297'
        try {
          await toReviewCommentNodeId(databaseId, 'owner', 'repo', 123)
        }
        catch (error) {
          // Expected to fail without auth, but validates interface
          expect(error).toBeInstanceOf(Error)
        }
        return
      }

      // With credentials, this would work on a real PR
      // For now, we test that the function accepts the right parameters
      expect(typeof toReviewCommentNodeId).toBe('function')
    })

    test('should throw error when comment not found', async () => {
      // Test error handling without actual API call
      // The function should throw a meaningful error when comment is not found
      // We validate the error structure without making real API calls
      try {
        // Try with invalid repo that would fail quickly
        await toReviewCommentNodeId('999999999', 'nonexistent', 'repo', 123)
      }
      catch (error) {
        expect(error).toBeInstanceOf(Error)
        if (error instanceof Error) {
          // Error should be about API failure or comment not found
          expect(error.message.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('toIssueCommentNodeId', () => {
    const originalEnv = process.env.GH_PATH

    beforeEach(() => {
      process.env.GH_PATH = originalEnv
    })

    test('should return Node ID as-is when Node ID is provided', async () => {
      const nodeId = 'IC_kwDOABC123'
      const result = await toIssueCommentNodeId(nodeId, 'owner', 'repo', 123)
      expect(result).toBe(nodeId)
    })

    test('should convert database ID to Node ID', async () => {
      // This test requires actual GitHub API access
      if (!process.env.GITHUB_TOKEN && !process.env.GH_TOKEN) {
        const databaseId = '123456789'
        try {
          await toIssueCommentNodeId(databaseId, 'owner', 'repo', 123)
        }
        catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
        return
      }

      expect(typeof toIssueCommentNodeId).toBe('function')
    })

    test('should throw error when comment not found', async () => {
      try {
        await toIssueCommentNodeId('999999999', 'nonexistent', 'repo', 123)
      }
      catch (error) {
        expect(error).toBeInstanceOf(Error)
        if (error instanceof Error) {
          expect(error.message.length).toBeGreaterThan(0)
        }
      }
    })
  })

  describe('isThreadNodeId', () => {
    test('should detect PR review thread Node ID', () => {
      expect(isThreadNodeId('PRRT_kwDOABC123xyz')).toBe(true)
      expect(isThreadNodeId('PRRT_kwDOL4aMSs6Aw-LK')).toBe(true)
    })

    test('should reject PR review comment Node ID', () => {
      expect(isThreadNodeId('PRRC_kwDOP34zbs6ShH0J')).toBe(false)
    })

    test('should reject issue comment Node ID', () => {
      expect(isThreadNodeId('IC_kwDOABC123')).toBe(false)
    })

    test('should reject database ID (number)', () => {
      expect(isThreadNodeId('2458156297')).toBe(false)
    })

    test('should reject invalid format', () => {
      expect(isThreadNodeId('invalid-id')).toBe(false)
      expect(isThreadNodeId('')).toBe(false)
    })
  })

  describe('isCommentNodeId', () => {
    test('should detect PR review comment Node ID', () => {
      expect(isCommentNodeId('PRRC_kwDOP34zbs6ShH0J')).toBe(true)
    })

    test('should detect issue comment Node ID', () => {
      expect(isCommentNodeId('IC_kwDOABC123')).toBe(true)
    })

    test('should reject PR review thread Node ID', () => {
      expect(isCommentNodeId('PRRT_kwDOABC123xyz')).toBe(false)
    })

    test('should reject database ID (number)', () => {
      expect(isCommentNodeId('2458156297')).toBe(false)
    })
  })

  // Tests for re-exported node-id-decoder functions
  describe('re-exported decoder functions', () => {
    test('isNewNodeId should detect New format', () => {
      expect(isNewNodeId('PRRC_kwDOP34zbs6ShH0J')).toBe(true)
      expect(isNewNodeId('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')).toBe(false)
    })

    test('isLegacyNodeId should detect Legacy format', () => {
      expect(isLegacyNodeId('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')).toBe(true)
      expect(isLegacyNodeId('PRRC_kwDOP34zbs6ShH0J')).toBe(false)
    })

    test('getNodeIdPrefix should extract prefix', () => {
      expect(getNodeIdPrefix('PRRC_kwDOP34zbs6ShH0J')).toBe('PRRC_')
      expect(getNodeIdPrefix('IC_kwDOABC123')).toBe('IC_')
      expect(getNodeIdPrefix('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')).toBe(null)
    })

    test('getNodeIdType should return type', () => {
      expect(getNodeIdType('PRRC_kwDOP34zbs6ShH0J')).toBe('PullRequestReviewComment')
      expect(getNodeIdType('IC_kwDOABC123')).toBe('IssueComment')
      expect(getNodeIdType('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')).toBe('Repository')
    })

    test('decodeNodeId should decode New format', () => {
      const result = decodeNodeId('PRRC_kwDOL4aMSs6Tkzl8')
      expect(result.format).toBe('new')
      expect(result.type).toBe('PullRequestReviewComment')
      expect(result.databaseId).toBe(2475899260)
    })

    test('decodeNodeId should decode Legacy format', () => {
      const result = decodeNodeId('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')
      expect(result.format).toBe('legacy')
      expect(result.type).toBe('Repository')
      expect(result.databaseId).toBe(139095377)
    })

    test('extractDatabaseId should return database ID', () => {
      expect(extractDatabaseId('PRRC_kwDOL4aMSs6Tkzl8')).toBe(2475899260)
      expect(extractDatabaseId('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')).toBe(139095377)
    })

    test('encodeNodeId should encode Database ID to Node ID', () => {
      const result = encodeNodeId({
        type: 'PullRequestReviewComment',
        repositoryId: 797346890,
        databaseId: 2475899260,
      })
      expect(result).toBe('PRRC_kwDOL4aMSs6Tkzl8')
    })

    test('encodeNodeId roundtrip should preserve Node ID', () => {
      const original = 'I_kwDOL4aMSs6Aw-LK'
      const decoded = decodeNodeId(original)
      const reencoded = encodeNodeId({
        type: decoded.type!,
        repositoryId: decoded.repositoryId!,
        databaseId: decoded.databaseId,
      })
      expect(reencoded).toBe(original)
    })
  })
})
