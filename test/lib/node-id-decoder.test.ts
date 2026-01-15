import { describe, expect, test } from 'bun:test'
import {
  decodeNodeId,
  extractDatabaseId,
  getNodeIdPrefix,
  getNodeIdType,
  isLegacyNodeId,
  isNewNodeId,
} from '../../src/lib/node-id-decoder'

describe('node-id-decoder', () => {
  describe('isNewNodeId', () => {
    test('should detect New format Node ID with prefix', () => {
      expect(isNewNodeId('PRRC_kwDOL4aMSs6Tkzl8')).toBe(true)
      expect(isNewNodeId('IC_kwDOABC123')).toBe(true)
      expect(isNewNodeId('I_kwDOABC123')).toBe(true)
      expect(isNewNodeId('PR_kwDOABC123')).toBe(true)
      expect(isNewNodeId('R_kwDOABC123')).toBe(true)
    })

    test('should reject Legacy format Node ID', () => {
      // Legacy format: plain Base64 without prefix
      expect(isNewNodeId('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')).toBe(false)
    })

    test('should reject invalid strings', () => {
      expect(isNewNodeId('invalid')).toBe(false)
      expect(isNewNodeId('123456')).toBe(false)
      expect(isNewNodeId('')).toBe(false)
    })
  })

  describe('isLegacyNodeId', () => {
    test('should detect Legacy format Node ID', () => {
      // Legacy format: "010:Repository139095377" encoded in Base64
      expect(isLegacyNodeId('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')).toBe(true)
      expect(isLegacyNodeId('MDQ6VXNlcjE=')).toBe(true) // "04:User1"
    })

    test('should reject New format Node ID', () => {
      expect(isLegacyNodeId('PRRC_kwDOL4aMSs6Tkzl8')).toBe(false)
      expect(isLegacyNodeId('IC_kwDOABC123')).toBe(false)
    })

    test('should reject invalid strings', () => {
      expect(isLegacyNodeId('invalid')).toBe(false)
      expect(isLegacyNodeId('123456')).toBe(false)
      expect(isLegacyNodeId('')).toBe(false)
    })
  })

  describe('getNodeIdPrefix', () => {
    test('should extract prefix from New format Node ID', () => {
      expect(getNodeIdPrefix('PRRC_kwDOL4aMSs6Tkzl8')).toBe('PRRC_')
      expect(getNodeIdPrefix('IC_kwDOABC123')).toBe('IC_')
      expect(getNodeIdPrefix('I_kwDOABC123')).toBe('I_')
      expect(getNodeIdPrefix('PR_kwDOABC123')).toBe('PR_')
    })

    test('should return null for Legacy format', () => {
      expect(getNodeIdPrefix('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')).toBe(null)
    })

    test('should return null for invalid strings', () => {
      expect(getNodeIdPrefix('invalid')).toBe(null)
      expect(getNodeIdPrefix('')).toBe(null)
    })
  })

  describe('getNodeIdType', () => {
    test('should return type for New format Node ID', () => {
      expect(getNodeIdType('PRRC_kwDOL4aMSs6Tkzl8')).toBe('PullRequestReviewComment')
      expect(getNodeIdType('IC_kwDOABC123')).toBe('IssueComment')
      expect(getNodeIdType('I_kwDOABC123')).toBe('Issue')
      expect(getNodeIdType('PR_kwDOABC123')).toBe('PullRequest')
      expect(getNodeIdType('R_kwDOABC123')).toBe('Repository')
      expect(getNodeIdType('PRRT_kwDOABC123')).toBe('PullRequestReviewThread')
    })

    test('should extract type from Legacy format', () => {
      // Legacy "010:Repository139095377"
      expect(getNodeIdType('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')).toBe('Repository')
    })

    test('should return null for unknown prefix', () => {
      expect(getNodeIdType('UNKNOWN_kwDOABC123')).toBe(null)
    })

    test('should return null for invalid strings', () => {
      expect(getNodeIdType('invalid')).toBe(null)
      expect(getNodeIdType('')).toBe(null)
    })
  })

  describe('decodeNodeId', () => {
    describe('New format (MessagePack)', () => {
      test('should decode PR review comment Node ID', () => {
        // PRRC_kwDOL4aMSs6Tkzl8 decodes to [0, 797346890, 2475899260]
        const result = decodeNodeId('PRRC_kwDOL4aMSs6Tkzl8')

        expect(result.format).toBe('new')
        expect(result.prefix).toBe('PRRC_')
        expect(result.type).toBe('PullRequestReviewComment')
        expect(result.databaseId).toBe(2475899260)
        expect(result.repositoryId).toBe(797346890)
        expect(result.raw).toEqual([0, 797346890, 2475899260])
      })

      test('should decode Issue Node ID', () => {
        // I_kwDOL4aMSs6Aw-LK decodes to [0, 797346890, 2160321226]
        const result = decodeNodeId('I_kwDOL4aMSs6Aw-LK')

        expect(result.format).toBe('new')
        expect(result.prefix).toBe('I_')
        expect(result.type).toBe('Issue')
        expect(result.databaseId).toBe(2160321226)
        expect(result.repositoryId).toBe(797346890)
      })

      test('should handle URL-safe Base64', () => {
        // Node IDs may use URL-safe Base64 (- and _ instead of + and /)
        const result = decodeNodeId('I_kwDOL4aMSs6Aw-LK')
        expect(result.databaseId).toBeGreaterThan(0)
      })
    })

    describe('Legacy format (text Base64)', () => {
      test('should decode Legacy Repository Node ID', () => {
        // "010:Repository139095377" in Base64
        const result = decodeNodeId('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')

        expect(result.format).toBe('legacy')
        expect(result.prefix).toBe(null)
        expect(result.type).toBe('Repository')
        expect(result.databaseId).toBe(139095377)
        expect(result.repositoryId).toBeUndefined()
      })

      test('should decode Legacy User Node ID', () => {
        // "04:User12345" in Base64
        const result = decodeNodeId('MDQ6VXNlcjEyMzQ1')

        expect(result.format).toBe('legacy')
        expect(result.type).toBe('User')
        expect(result.databaseId).toBe(12345)
      })

      test('should decode Legacy Issue Node ID', () => {
        // "012:Issue1000" in Base64
        const result = decodeNodeId('MDEyOklzc3VlMTAwMA==')

        expect(result.format).toBe('legacy')
        expect(result.type).toBe('Issue')
        expect(result.databaseId).toBe(1000)
      })
    })

    describe('error cases', () => {
      test('should throw for invalid Node ID', () => {
        expect(() => decodeNodeId('invalid')).toThrow()
        expect(() => decodeNodeId('')).toThrow()
      })

      test('should throw for Database ID (numeric string)', () => {
        expect(() => decodeNodeId('123456789')).toThrow()
      })

      test('should throw for corrupted Base64', () => {
        expect(() => decodeNodeId('PRRC_!@#$%')).toThrow()
      })
    })
  })

  describe('extractDatabaseId', () => {
    test('should extract Database ID from New format', () => {
      expect(extractDatabaseId('PRRC_kwDOL4aMSs6Tkzl8')).toBe(2475899260)
    })

    test('should extract Database ID from Legacy format', () => {
      expect(extractDatabaseId('MDEwOlJlcG9zaXRvcnkxMzkwOTUzNzc=')).toBe(139095377)
    })

    test('should throw for invalid Node ID', () => {
      expect(() => extractDatabaseId('invalid')).toThrow()
    })
  })
})
