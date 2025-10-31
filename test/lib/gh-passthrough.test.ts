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
    test('should inject --json flag for unmapped commands (list commands)', () => {
      // Arrange
      const args = ['issue', 'list', '--state', 'open']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toEqual(['issue', 'list', '--state', 'open', '--json'])
    })

    test('should inject --json with fields for mapped commands (view commands)', () => {
      // Arrange
      const args = ['issue', 'view', '123']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result[0]).toBe('issue')
      expect(result[1]).toBe('view')
      expect(result[2]).toBe('123')
      expect(result[3]).toBe('--json')
      expect(result[4]).toContain('assignees') // Should contain fields
      expect(result[4]).toContain('author')
      expect(result[4]).toContain('title')
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

    // Additional tests for field injection (Phase 4)
    test('should inject fields for mapped view commands (issue view)', () => {
      // Arrange
      const args = ['issue', 'view', '123']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result[result.length - 1]).toContain('assignees')
      expect(result[result.length - 1]).toContain('author')
      expect(result[result.length - 1]).toContain('body')
      expect(result[result.length - 1]).not.toContain(' ') // No spaces in field list
    })

    test('should inject fields for mapped view commands (pr view)', () => {
      // Arrange
      const args = ['pr', 'view', '456']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result[result.length - 1]).toContain('additions')
      expect(result[result.length - 1]).toContain('assignees')
      expect(result[result.length - 1]).toContain('baseRefName')
      expect(result[result.length - 1]).not.toContain(' ')
    })

    test('should inject fields for mapped view commands (repo view)', () => {
      // Arrange
      const args = ['repo', 'view', 'owner/repo']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result[result.length - 1]).toContain('name')
      expect(result[result.length - 1]).toContain('owner')
      expect(result[result.length - 1]).toContain('description')
      expect(result[result.length - 1]).not.toContain(' ')
    })

    test('should inject fields for mapped view commands (release view)', () => {
      // Arrange
      const args = ['release', 'view', 'v1.0.0']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result[result.length - 1]).toContain('tagName')
      expect(result[result.length - 1]).toContain('assets')
      expect(result[result.length - 1]).not.toContain(' ')
    })

    test('should fallback to --json only for unmapped commands (workflow list)', () => {
      // Arrange
      const args = ['workflow', 'list']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result).toEqual(['workflow', 'list', '--json'])
      // Should not inject fields for unmapped commands
      expect(result.length).toBe(3)
    })

    test('should fallback to --json only for unmapped commands (run list)', () => {
      // Arrange
      const args = ['run', 'list']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result).toContain('--json')
      expect(result).toEqual(['run', 'list', '--json'])
      // Should not inject fields for unmapped commands
      expect(result.length).toBe(3)
    })

    test('should preserve other arguments when injecting fields', () => {
      // Arrange
      const args = ['issue', 'view', '123', '--repo', 'owner/repo']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      expect(result[0]).toBe('issue')
      expect(result[1]).toBe('view')
      expect(result[2]).toBe('123')
      expect(result[3]).toBe('--repo')
      expect(result[4]).toBe('owner/repo')
      expect(result[5]).toBe('--json')
      expect(result[6]).toBeTruthy() // Fields should be present
    })

    test('should use comma-separated fields with no spaces', () => {
      // Arrange
      const args = ['issue', 'view', '1']

      // Act
      const result = injectJsonFlag(args)

      // Assert
      const fields = result[result.length - 1]
      expect(fields).not.toContain(' ')
      expect(fields).toMatch(/^[\w,]+$/) // \w matches uppercase/lowercase letters, digits, and underscores; appropriate for camelCase field names. Only word characters and commas.
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

      // Assert - repo view should now inject fields from GH_JSON_FIELDS
      expect(executeGhCommandSpy).toHaveBeenCalledTimes(1)
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('repo')
      expect(callArgs[1]).toBe('view')
      expect(callArgs[2]).toBe('--json')
      expect(callArgs[3]).toContain('archivedAt') // Should contain repo view fields
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

    test('should handle fields required error when command not mapped', async () => {
      // Arrange
      const errorMessage = 'Specify one or more comma-separated fields for `--json`:\nassignees\nauthor\nbody\ncreatedAt'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
      })

      const args = ['custom', 'view', '123', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalled()
      // Check for fields required message (language-agnostic check)
      const allErrorOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(allErrorOutput).toMatch(/field mapping|필드 매핑/)
      // Should show available fields header
      expect(allErrorOutput).toContain('Available fields')
      // Should suggest running update-fields
      expect(allErrorOutput).toContain('update-fields')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should distinguish between fields required and json not supported errors', async () => {
      // Arrange - Fields required error
      const fieldsRequiredError = 'Specify one or more comma-separated fields for `--json`:\nfield1\nfield2'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: fieldsRequiredError,
        exitCode: 1,
      })

      const args1 = ['unmapped', 'view', '123', '--format', 'toon']

      // Act
      await passThroughCommand(args1)

      // Assert - Should show fields required message
      const fieldsOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(fieldsOutput).toMatch(/field mapping|필드 매핑/)
      expect(fieldsOutput).not.toMatch(/not support|지원하지 않습니다/)

      // Reset spies
      consoleErrorSpy.mockClear()
      processExitSpy.mockClear()

      // Arrange - JSON not supported error
      const jsonNotSupportedError = 'unknown flag: --json'
      executeGhCommandSpy.mockResolvedValue({
        stdout: '',
        stderr: jsonNotSupportedError,
        exitCode: 1,
      })

      const args2 = ['workflow', 'run', 'test', '--format', 'toon']

      // Act
      await passThroughCommand(args2)

      // Assert - Should show json not supported message
      const jsonOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(jsonOutput).toMatch(/not support|지원하지 않습니다/)
      expect(jsonOutput).not.toMatch(/field mapping|필드 매핑/)
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

    // Integration tests for field injection with TOON/JSON conversion (Phase 4)
    test('should inject fields and convert to TOON for issue view', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify({
        number: 123,
        title: 'Test Issue',
        author: { login: 'testuser' },
        state: 'OPEN',
        body: 'Test body',
      })
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'view', '123', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('issue')
      expect(callArgs[1]).toBe('view')
      expect(callArgs[2]).toBe('123')
      expect(callArgs[3]).toBe('--json')
      expect(callArgs[4]).toContain('assignees')
      expect(callArgs[4]).toContain('author')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should inject fields and convert to JSON for pr view', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify({
        number: 456,
        title: 'Test PR',
        additions: 10,
        deletions: 5,
        state: 'OPEN',
      })
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['pr', 'view', '456', '--format', 'json']

      // Act
      await passThroughCommand(args)

      // Assert
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[0]).toBe('pr')
      expect(callArgs[1]).toBe('view')
      expect(callArgs[2]).toBe('456')
      expect(callArgs[3]).toBe('--json')
      expect(callArgs[4]).toContain('additions')
      expect(callArgs[4]).toContain('deletions')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should convert list commands to TOON without field injection', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([
        { number: 1, title: 'Issue 1' },
        { number: 2, title: 'Issue 2' },
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
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs).toEqual(['issue', 'list', '--json'])
      // No fields injected for list commands
      expect(callArgs.length).toBe(3)
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should detect fields required error for unmapped view commands', async () => {
      // Arrange
      const errorMessage = 'Specify one or more comma-separated fields for `--json`:\nfield1\nfield2\nfield3'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
      })

      const args = ['label', 'view', 'bug', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      const allErrorOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(allErrorOutput).toMatch(/field mapping|필드 매핑/)
      expect(allErrorOutput).toContain('Available fields')
      expect(allErrorOutput).toContain('update-fields')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should detect --json not supported error', async () => {
      // Arrange
      const errorMessage = 'unknown flag: --json\nUsage: gh workflow run <name>'
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: '',
        stderr: errorMessage,
        exitCode: 1,
      })

      const args = ['workflow', 'run', 'test', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      const allErrorOutput = consoleErrorSpy.mock.calls.flat().join(' ')
      expect(allErrorOutput).toMatch(/not support|지원하지 않습니다/)
      expect(allErrorOutput).toContain('Troubleshooting')
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })

    test('should handle TOON conversion with nested objects in injected fields', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify({
        number: 789,
        title: 'Complex Issue',
        author: { login: 'user1', email: 'user1@example.com' },
        assignees: [
          { login: 'assignee1' },
          { login: 'assignee2' },
        ],
      })
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['issue', 'view', '789', '--format', 'toon']

      // Act
      await passThroughCommand(args)

      // Assert
      const callArgs = executeGhCommandSpy.mock.calls[0][0]
      expect(callArgs[4]).toContain('assignees')
      expect(callArgs[4]).toContain('author')
      expect(processExitSpy).not.toHaveBeenCalled()
    })

    test('should handle JSON conversion with array data in injected fields', async () => {
      // Arrange
      const mockJsonOutput = JSON.stringify([
        { number: 1, title: 'Item 1', state: 'OPEN' },
        { number: 2, title: 'Item 2', state: 'CLOSED' },
        { number: 3, title: 'Item 3', state: 'OPEN' },
      ])
      executeGhCommandSpy = spyOn(ghPassthrough, 'executeGhCommand').mockResolvedValue({
        stdout: mockJsonOutput,
        stderr: '',
        exitCode: 0,
      })

      const args = ['workflow', 'list', '--format', 'json']

      // Act
      await passThroughCommand(args)

      // Assert
      expect(executeGhCommandSpy).toHaveBeenCalledWith(['workflow', 'list', '--json'])
      expect(processExitSpy).not.toHaveBeenCalled()
    })
  })
})
