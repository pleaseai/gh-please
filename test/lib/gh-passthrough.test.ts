import { describe, expect, test } from 'bun:test'
import { executeGhCommand, shouldConvertToStructuredFormat } from '../../src/lib/gh-passthrough'

describe('gh-passthrough', () => {
  describe('executeGhCommand', () => {
    test('should execute gh CLI command and return stdout', async () => {
      // Arrange
      const args = ['--version']

      // Act
      const result = await executeGhCommand(args)

      // Assert
      expect(result.stdout).toContain('gh version')
      expect(result.exitCode).toBe(0)
    })

    test('should capture stderr when command fails', async () => {
      // Arrange
      const args = ['invalid-command-that-does-not-exist']

      // Act
      const result = await executeGhCommand(args)

      // Assert
      expect(result.stderr).toBeTruthy()
      expect(result.exitCode).not.toBe(0)
    })

    test('should preserve exit code from gh CLI', async () => {
      // Arrange
      const args = ['api', 'nonexistent-endpoint']

      // Act
      const result = await executeGhCommand(args)

      // Assert
      expect(result.exitCode).not.toBe(0)
    })
  })

  describe('shouldConvertToStructuredFormat', () => {
    test('should detect --format toon flag', () => {
      // Arrange
      const args = ['issue', 'list', '--format', 'toon']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.cleanArgs).toEqual(['issue', 'list'])
    })

    test('should detect --format json flag', () => {
      // Arrange
      const args = ['pr', 'list', '--format', 'json']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('json')
      expect(result.cleanArgs).toEqual(['pr', 'list'])
    })

    test('should return null when no format flag present', () => {
      // Arrange
      const args = ['repo', 'view']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBeNull()
      expect(result.cleanArgs).toEqual(['repo', 'view'])
    })

    test('should extract and remove format flag from args', () => {
      // Arrange
      const args = ['issue', 'list', '--state', 'open', '--format', 'toon', '--limit', '10']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.cleanArgs).toEqual(['issue', 'list', '--state', 'open', '--limit', '10'])
      expect(result.cleanArgs).not.toContain('--format')
      expect(result.cleanArgs).not.toContain('toon')
    })

    test('should handle --format=toon syntax', () => {
      // Arrange
      const args = ['issue', 'list', '--format=toon']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.cleanArgs).toEqual(['issue', 'list'])
    })
  })
})
