import { describe, expect, test } from 'bun:test'
import { executeQuery } from '../../../src/lib/jmespath-query'

/**
 * Integration tests for JMESPath query support in repo commands
 *
 * These tests verify that the query functionality works correctly
 * with the data structures returned by repo commands.
 */
describe('JMESPath integration with repo commands', () => {
  describe('repo list queries', () => {
    const mockRepos = [
      {
        name: 'project-a',
        owner: 'testuser',
        description: 'Main project',
        url: 'https://github.com/testuser/project-a',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        isPrivate: false,
        isFork: false,
        stargazerCount: 100,
        primaryLanguage: 'TypeScript',
      },
      {
        name: 'fork-repo',
        owner: 'testuser',
        description: 'Forked repository',
        url: 'https://github.com/testuser/fork-repo',
        createdAt: '2024-02-01T00:00:00Z',
        updatedAt: '2024-02-10T00:00:00Z',
        isPrivate: false,
        isFork: true,
        stargazerCount: 5,
        primaryLanguage: 'JavaScript',
      },
      {
        name: 'private-project',
        owner: 'testuser',
        description: 'Private work',
        url: 'https://github.com/testuser/private-project',
        createdAt: '2024-03-01T00:00:00Z',
        updatedAt: '2024-03-20T00:00:00Z',
        isPrivate: true,
        isFork: false,
        stargazerCount: 0,
        primaryLanguage: 'Python',
      },
    ]

    test('should filter non-fork repositories', () => {
      const result = executeQuery(mockRepos, '[?isFork==`false`]')
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('project-a')
      expect(result[1].name).toBe('private-project')
    })

    test('should filter forked repositories', () => {
      const result = executeQuery(mockRepos, '[?isFork==`true`]')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('fork-repo')
    })

    test('should filter public repositories', () => {
      const result = executeQuery(mockRepos, '[?isPrivate==`false`]')
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('project-a')
      expect(result[1].name).toBe('fork-repo')
    })

    test('should filter private repositories', () => {
      const result = executeQuery(mockRepos, '[?isPrivate==`true`]')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('private-project')
    })

    test('should filter by programming language', () => {
      const result = executeQuery(mockRepos, '[?primaryLanguage==\'TypeScript\']')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('project-a')
    })

    test('should filter by minimum stars', () => {
      const result = executeQuery(mockRepos, '[?stargazerCount >= `10`]')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('project-a')
      expect(result[0].stargazerCount).toBe(100)
    })

    test('should project specific fields', () => {
      const result = executeQuery(mockRepos, '[].{name:name,owner:owner,stars:stargazerCount}')
      expect(result).toHaveLength(3)
      expect(result[0]).toEqual({ name: 'project-a', owner: 'testuser', stars: 100 })
      expect(Object.keys(result[0])).toEqual(['name', 'owner', 'stars'])
    })

    test('should filter and project', () => {
      const result = executeQuery(
        mockRepos,
        '[?isFork==`false`].{name:name,language:primaryLanguage,stars:stargazerCount}',
      )
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ name: 'project-a', language: 'TypeScript', stars: 100 })
      expect(result[1]).toEqual({ name: 'private-project', language: 'Python', stars: 0 })
    })

    test('should sort by stars descending', () => {
      const result = executeQuery(mockRepos, 'reverse(sort_by(@, &stargazerCount))[].name')
      expect(result).toEqual(['project-a', 'fork-repo', 'private-project'])
    })

    test('should get repository names only', () => {
      const result = executeQuery(mockRepos, '[?isFork==`false`].name')
      expect(result).toEqual(['project-a', 'private-project'])
    })

    test('should count repositories by condition', () => {
      const result = executeQuery(mockRepos, 'length([?isPrivate==`false`])')
      expect(result).toBe(2)
    })

    test('should combine multiple conditions', () => {
      const result = executeQuery(mockRepos, '[?isFork==`false` && isPrivate==`false`]')
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('project-a')
    })
  })

  describe('error handling', () => {
    test('should handle invalid query syntax', () => {
      const data = [{ name: 'test' }]
      expect(() => executeQuery(data, '[?invalid syntax')).toThrow('Invalid JMESPath query')
    })

    test('should handle queries on empty arrays', () => {
      const result = executeQuery([], '[?isFork==`false`]')
      expect(result).toEqual([])
    })

    test('should handle null values gracefully', () => {
      const dataWithNull = [
        { name: 'repo1', primaryLanguage: 'TypeScript' },
        { name: 'repo2', primaryLanguage: '' },
      ]
      const result = executeQuery(dataWithNull, '[?primaryLanguage]')
      // Empty string is falsy, so it should be filtered out
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('repo1')
    })
  })
})
