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
