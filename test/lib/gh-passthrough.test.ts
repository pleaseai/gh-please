import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import * as ghPassthrough from '../../src/lib/gh-passthrough'
import { executeGhCommand, injectJsonFlag, passThroughCommand, shouldConvertToStructuredFormat } from '../../src/lib/gh-passthrough'

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

    test('should ignore invalid format values', () => {
      // Arrange
      const args = ['issue', 'list', '--format', 'xml']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBeNull()
      expect(result.cleanArgs).toEqual(['issue', 'list'])
    })

    test('should handle --format at end without value', () => {
      // Arrange
      const args = ['issue', 'list', '--format']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBeNull()
      expect(result.cleanArgs).toEqual(['issue', 'list'])
    })

    test('should handle multiple --format flags (last wins)', () => {
      // Arrange
      const args = ['issue', 'list', '--format', 'json', '--format', 'toon']

      // Act
      const result = shouldConvertToStructuredFormat(args)

      // Assert
      expect(result.format).toBe('toon')
      expect(result.cleanArgs).toEqual(['issue', 'list'])
    })
  })

  describe('injectJsonFlag', () => {
    test('should inject --json flag at end of args', () => {
      // Arrange
      const args = ['issue', 'list', '--state', 'open']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toEqual(['issue', 'list', '--state', 'open', '--json'])
    })

    test('should not mutate original args array', () => {
      // Arrange
      const original = ['issue', 'list']

      // Act
      const result = injectJsonFlag(original)

      // Assert
      expect(result).toEqual(['issue', 'list', '--json'])
      expect(original).toEqual(['issue', 'list']) // Original unchanged
      expect(result).not.toBe(original) // Different array reference
    })

    test('should handle empty args array', () => {
      // Arrange
      const args: string[] = []

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toEqual(['--json'])
    })
  })

  describe('passThroughCommand', () => {
    let executeGhCommandSpy: ReturnType<typeof spyOn>
    let consoleErrorSpy: ReturnType<typeof spyOn>
    let processExitSpy: ReturnType<typeof spyOn>
    let processStdoutWriteSpy: ReturnType<typeof spyOn>

    beforeEach(() => {
      // Mock console.error to suppress error output during tests
      consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
      // Mock process.exit to prevent test termination
      processExitSpy = spyOn(process, 'exit').mockImplementation((() => {}) as any)
      // Mock process.stdout.write to capture output
      processStdoutWriteSpy = spyOn(process.stdout, 'write').mockImplementation(() => true)
    })

    afterEach(() => {
      executeGhCommandSpy?.mockRestore()
      consoleErrorSpy.mockRestore()
      processExitSpy.mockRestore()
      processStdoutWriteSpy.mockRestore()
    })

    test('should convert to TOON format when --format toon flag present', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([
        { number: 1, title: 'Issue 1', state: 'OPEN' },
        { number: 2, title: 'Issue 2', state: 'CLOSED' },
      ])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'list', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(executeGhCommandSpy).toHaveBeenCalledWith(['issue', 'list', '--json'])
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should convert to JSON format when --format json flag present', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify({ name: 'test-repo', owner: 'test-owner' })
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['repo', 'view', '--format', 'json']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(executeGhCommandSpy).toHaveBeenCalledWith(['repo', 'view', '--json'])
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should preserve original output when no format flag present', async () => {
      // Arrange
      const mockOutput = 'Repository: test-owner/test-repo\nStars: 100'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['repo', 'view']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(executeGhCommandSpy).toHaveBeenCalledWith(['repo', 'view'])
      expect(processStdoutWriteSpy).toHaveBeenCalledWith(mockOutput)
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should handle JSON parse failures with helpful error message', async () => {
      // Arrange
      const invalidJson = 'not valid json output'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: invalidJson,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'list', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled()
      // Check for JSON parse error message
      expect(consoleErrorSpy.mock.calls.some((call: any[]) =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('JSON')),
      )).toBe(true)
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should handle --json not supported error with helpful message', async () => {
      // Arrange
      const errorMessage = 'unknown flag: --json'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
      })

      const args = ['workflow', 'run', 'test', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled()
      // Check for --json not supported message
      expect(consoleErrorSpy.mock.calls.some((call: any[]) =>
        call.some((arg: any) =>
          typeof arg === 'string'
          && (arg.includes('not support') || arg.includes('지원하지 않습니다')),
        ),
      )).toBe(true)
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should pass through gh CLI errors when format not requested', async () => {
      // Arrange
      const errorMessage = 'API error: resource not found'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
      })

      const processStderrWriteSpy = spyOn(process.stderr, 'write').mockImplementation(() => true)
      const args = ['api', 'nonexistent-endpoint']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(processStderrWriteSpy).toHaveBeenCalledWith(errorMessage)
      expect(processExitSpy).toHaveBeenCalledWith(1)

      processStderrWriteSpy.mockRestore()
    })

    test('should handle empty JSON output gracefully', async () => {
      // Arrange
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'list', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(executeGhCommandSpy).toHaveBeenCalledWith(['issue', 'list', '--json'])
      expect(processExitSpy).not.toHaveBeenCalled()
      // Empty output should not cause parse error
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })
})
