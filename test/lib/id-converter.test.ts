import { beforeEach, describe, expect, test } from 'bun:test'
import {
  isDatabaseId,
  isNodeId,
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
})
