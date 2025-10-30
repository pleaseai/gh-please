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
})
