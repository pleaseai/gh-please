import { describe, expect, test } from 'bun:test'
import { executeQuery } from '../../../src/lib/jmespath-query'

/**
 * Integration tests for JMESPath query support in issue commands
 *
 * These tests verify that the query functionality works correctly
 * with the data structures returned by issue commands.
 */
describe('JMESPath integration with issue commands', () => {
  describe('sub-issue list queries', () => {
    const mockSubIssues = [
      { number: 124, title: 'Implement auth', state: 'OPEN', nodeId: 'I_1', url: 'https://github.com/org/repo/issues/124' },
      { number: 125, title: 'Add tests', state: 'CLOSED', nodeId: 'I_2', url: 'https://github.com/org/repo/issues/125' },
      { number: 126, title: 'Fix bug', state: 'OPEN', nodeId: 'I_3', url: 'https://github.com/org/repo/issues/126' },
    ]

    test('should filter by state', () => {
      const result = executeQuery(mockSubIssues, '[?state==\'OPEN\']')
      expect(result).toHaveLength(2)
      expect(result[0].number).toBe(124)
      expect(result[1].number).toBe(126)
    })

    test('should project specific fields', () => {
      const result = executeQuery(mockSubIssues, '[].{number:number,title:title}')
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ number: 124, title: 'Implement auth' })
      expect(Object.keys(result[0])).toEqual(['number', 'title'])
    })

    test('should filter and project', () => {
      const result = executeQuery(mockSubIssues, '[?state==\'OPEN\'].{number:number,title:title}')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ number: 124, title: 'Implement auth' })
      expect(result[1]).toEqual({ number: 126, title: 'Fix bug' })
    })
  })

  describe('dependency list queries', () => {
    const mockDependencies = [
      { number: 100, title: 'Blocker 1', state: 'OPEN', nodeId: 'I_100', url: 'https://github.com/org/repo/issues/100' },
      { number: 101, title: 'Blocker 2', state: 'CLOSED', nodeId: 'I_101', url: 'https://github.com/org/repo/issues/101' },
    ]

    test('should filter open blockers', () => {
      const result = executeQuery(mockDependencies, '[?state==\'OPEN\']')
      expect(result).toHaveLength(1)
      expect(result[0].number).toBe(100)
    })

    test('should get count of open blockers', () => {
      const result = executeQuery(mockDependencies, 'length([?state==\'OPEN\'])')
      expect(result).toBe(1)
    })
  })

  describe('type list queries', () => {
    const mockTypes = [
      { id: 'T1', name: 'Bug', description: 'Bug report', color: 'RED', isEnabled: true },
      { id: 'T2', name: 'Feature', description: 'Feature request', color: 'GREEN', isEnabled: true },
      { id: 'T3', name: 'Deprecated', description: 'Old type', color: 'GRAY', isEnabled: false },
    ]

    test('should filter enabled types', () => {
      const result = executeQuery(mockTypes, '[?isEnabled==`true`]')
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Bug')
      expect(result[1].name).toBe('Feature')
    })

    test('should get type names only', () => {
      const result = executeQuery(mockTypes, '[?isEnabled==`true`].name')
      expect(result).toEqual(['Bug', 'Feature'])
    })
  })

  describe('comment list queries', () => {
    const mockComments = [
      { id: 1, body: 'First comment', author: 'alice', createdAt: '2025-01-01', updatedAt: '2025-01-01', url: 'https://...' },
      { id: 2, body: 'Second comment', author: 'bob', createdAt: '2025-01-02', updatedAt: '2025-01-02', url: 'https://...' },
      { id: 3, body: 'Third comment', author: 'alice', createdAt: '2025-01-03', updatedAt: '2025-01-03', url: 'https://...' },
    ]

    test('should filter by author', () => {
      const result = executeQuery(mockComments, '[?author==\'alice\']')
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1)
      expect(result[1].id).toBe(3)
    })

    test('should project comment IDs and authors', () => {
      const result = executeQuery(mockComments, '[].{id:id,author:author}')
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ id: 1, author: 'alice' })
    })
  })

  describe('error handling', () => {
    test('should handle invalid query syntax', () => {
      const data = [{ number: 1 }]
      expect(() => executeQuery(data, '[?invalid syntax')).toThrow('Invalid JMESPath query')
    })

    test('should handle queries on empty arrays', () => {
      const result = executeQuery([], '[?state==\'OPEN\']')
      expect(result).toEqual([])
    })
  })
})
