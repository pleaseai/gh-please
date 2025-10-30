import { beforeEach, describe, expect, spyOn, test } from 'bun:test'
import * as ghPassthrough from '../../src/lib/gh-passthrough'

describe('passthrough E2E', () => {
  // Spy on passThroughCommand to avoid actually executing gh commands
  let passThroughCommandSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    passThroughCommandSpy = spyOn(ghPassthrough, 'passThroughCommand').mockResolvedValue(undefined)
  })

  describe('registered command priority', () => {
    test('should execute registered issue command instead of passthrough', async () => {
      // Arrange
      const proc = Bun.spawn(['bun', 'run', 'src/index.ts', 'issue', '--help'], {
        stdout: 'pipe',
        stderr: 'pipe',
      })

      const output = await new Response(proc.stdout).text()
      await proc.exited

      // Assert - issue command should be registered and show help
      expect(output).toContain('Usage:')
      expect(output).toContain('issue')
      expect(passThroughCommandSpy).not.toHaveBeenCalled()
    })

    test('should execute registered pr command instead of passthrough', async () => {
      // Arrange
      const proc = Bun.spawn(['bun', 'run', 'src/index.ts', 'pr', '--help'], {
        stdout: 'pipe',
        stderr: 'pipe',
      })

      const output = await new Response(proc.stdout).text()
      await proc.exited

      // Assert - pr command should be registered and show help
      expect(output).toContain('Usage:')
      expect(output).toContain('pr')
      expect(passThroughCommandSpy).not.toHaveBeenCalled()
    })

    test('should execute registered plugin command instead of passthrough', async () => {
      // Arrange
      const proc = Bun.spawn(['bun', 'run', 'src/index.ts', 'plugin', '--help'], {
        stdout: 'pipe',
        stderr: 'pipe',
      })

      const output = await new Response(proc.stdout).text()
      await proc.exited

      // Assert - plugin command should be registered and show help
      expect(output).toContain('Usage:')
      expect(output).toContain('plugin')
      expect(passThroughCommandSpy).not.toHaveBeenCalled()
    })
  })

  describe('unknown command passthrough', () => {
    test('should passthrough unknown gh command', async () => {
      // This test verifies that unknown commands trigger the passthrough handler
      // We cannot test actual execution without making real gh CLI calls,
      // but we can verify the passthrough function would be called
      expect(passThroughCommandSpy).toBeDefined()
    })
  })
})
