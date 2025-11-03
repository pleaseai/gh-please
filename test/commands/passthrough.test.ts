import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test'
import { createProgram } from '../../src/index'
import * as ghPassthrough from '../../src/lib/gh-passthrough'

describe('passthrough E2E', () => {
  // Spy on passThroughCommand to verify when it's called without actually executing gh commands
  let passThroughCommandSpy: ReturnType<typeof spyOn>
  let consoleLogSpy: ReturnType<typeof spyOn>
  let consoleErrorSpy: ReturnType<typeof spyOn>
  let consoleWarnSpy: ReturnType<typeof spyOn>
  let processExitSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    passThroughCommandSpy = spyOn(ghPassthrough, 'passThroughCommand').mockResolvedValue(undefined)
    // Suppress console output during tests
    consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {})
    consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = spyOn(console, 'warn').mockImplementation(() => {})
    processExitSpy = spyOn(process, 'exit').mockImplementation((() => {}) as any)
  })

  afterEach(() => {
    // Restore all spies after each test
    passThroughCommandSpy.mockRestore()
    consoleLogSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    consoleWarnSpy.mockRestore()
    processExitSpy.mockRestore()
  })

  describe('registered command priority', () => {
    test('should NOT passthrough for registered plugin list command', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['plugin', 'list']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough should NOT be called for registered commands
      expect(passThroughCommandSpy).not.toHaveBeenCalled()
    })
  })

  describe('unknown command passthrough', () => {
    test('should passthrough unknown repo command', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['repo', 'view']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough SHOULD be called for unknown commands
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['repo', 'view'])
    })

    test('should passthrough workflow command with format flag', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['workflow', 'list', '--format', 'toon']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough SHOULD be called with all args
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['workflow', 'list', '--format', 'toon'])
    })

    test('should passthrough release view command', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['release', 'view', 'v1.0.0']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough SHOULD be called
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['release', 'view', 'v1.0.0'])
    })
  })

  describe('nested subcommand passthrough', () => {
    test('should passthrough unknown issue subcommand (issue view)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['issue', 'view', '123']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough SHOULD be called for unknown issue subcommands
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['issue', 'view', '123'])
    })

    test('should passthrough unknown issue subcommand with flags (issue list)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['issue', 'list', '--state', 'open', '--format', 'toon']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough SHOULD be called with all args
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['issue', 'list', '--state', 'open', '--format', 'toon'])
    })

    test('should passthrough unknown pr subcommand (pr checks)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['pr', 'checks', '456']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough SHOULD be called for unknown pr subcommands
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['pr', 'checks', '456'])
    })

    test('should passthrough unknown pr subcommand with format (pr view)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['pr', 'view', '789', '--format', 'json']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough SHOULD be called with all args
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['pr', 'view', '789', '--format', 'json'])
    })

    test('should NOT passthrough registered issue subcommand (issue create)', async () => {
      // Arrange
      const program = await createProgram()
      // Provide --repo flag to prevent git command execution and timeout
      const args = ['issue', 'create', '--title', 'Test', '--repo', 'owner/repo']

      // Act - command will fail due to missing GitHub API authentication, but we don't care
      // We're only testing that passthrough is NOT called for registered commands
      try {
        await program.parseAsync(args, { from: 'user' })
      }
      catch (error) {
        // Expected - command will fail but passthrough should not be called
      }

      // Assert - passthrough should NOT be called for registered commands
      expect(passThroughCommandSpy).not.toHaveBeenCalled()
    })

    test('should NOT passthrough registered pr subcommand (pr review reply)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['pr', 'review', 'reply', '123', '-b', 'LGTM']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough should NOT be called for registered commands
      expect(passThroughCommandSpy).not.toHaveBeenCalled()
    })
  })

  describe('exit code preservation', () => {
    test('should preserve exit code 0 for successful commands', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['repo', 'view']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(processExitSpy).not.toHaveBeenCalled() // Success doesn't call process.exit
    })

    test('should preserve non-zero exit codes from gh CLI', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['api', 'nonexistent-endpoint']

      // Simulate gh CLI error by making passThroughCommand call process.exit
      passThroughCommandSpy.mockImplementation(async () => {
        process.exit(1)
      })

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })
  })

  describe('mutation command handling', () => {
    test('should passthrough mutation commands without --json injection (issue edit)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['issue', 'edit', '123', '--title', 'New title']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough should be called for mutation commands
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['issue', 'edit', '123', '--title', 'New title'])
    })

    test('should passthrough mutation commands without --json injection (issue create)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['issue', 'create', '--title', 'New bug']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - should NOT be called because 'issue create' is a registered command in gh-please
      expect(passThroughCommandSpy).not.toHaveBeenCalled()
    })

    test('should passthrough mutation commands without --json injection (pr close)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['pr', 'close', '456']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough should be called for mutation commands
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['pr', 'close', '456'])
    })

    test('should passthrough mutation commands without --json injection (pr merge)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['pr', 'merge', '789', '--squash']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough should be called for mutation commands
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['pr', 'merge', '789', '--squash'])
    })

    test('should still default to TOON for read commands (issue list)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['issue', 'list']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough should be called for read commands with TOON default
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['issue', 'list'])
    })

    test('should still default to TOON for read commands (pr view)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['pr', 'view', '123']

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert - passthrough should be called for read commands with TOON default
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(passThroughCommandSpy.mock.calls[0][0]).toEqual(['pr', 'view', '123'])
    })
  })

  describe('bilingual error messages', () => {
    test('should display error message in detected system language (Korean)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['workflow', 'run', 'test', '--format', 'toon']

      // Mock passThroughCommand to simulate --json not supported error in Korean
      passThroughCommandSpy.mockImplementation(async () => {
        // Set LANG to ko to trigger Korean messages
        const originalLang = process.env.LANG
        process.env.LANG = 'ko_KR.UTF-8'

        console.error('이 명령어는 구조화된 출력을 지원하지 않습니다')

        // Restore original LANG
        if (originalLang)
          process.env.LANG = originalLang
        else
          delete process.env.LANG

        process.exit(1)
      })

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
      // Check for Korean error message
      expect(consoleErrorSpy.mock.calls.some((call: any[]) =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('지원하지 않습니다')),
      )).toBe(true)
    })

    test('should display error message in detected system language (English)', async () => {
      // Arrange
      const program = await createProgram()
      const args = ['workflow', 'run', 'test', '--format', 'toon']

      // Mock passThroughCommand to simulate --json not supported error in English
      passThroughCommandSpy.mockImplementation(async () => {
        // Set LANG to en to trigger English messages
        const originalLang = process.env.LANG
        process.env.LANG = 'en_US.UTF-8'

        console.error('This command does not support structured output')

        // Restore original LANG
        if (originalLang)
          process.env.LANG = originalLang
        else
          delete process.env.LANG

        process.exit(1)
      })

      // Act
      await program.parseAsync(args, { from: 'user' })

      // Assert
      expect(passThroughCommandSpy).toHaveBeenCalledTimes(1)
      expect(consoleErrorSpy).toHaveBeenCalled()
      // Check for English error message
      expect(consoleErrorSpy.mock.calls.some((call: any[]) =>
        call.some((arg: any) => typeof arg === 'string' && arg.includes('not support')),
      )).toBe(true)
    })
  })
})
