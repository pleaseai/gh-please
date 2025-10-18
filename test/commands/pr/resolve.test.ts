import { describe, expect, test } from 'bun:test'
import { createResolveCommand } from '../../../src/commands/pr/resolve'

describe('resolve command', () => {
  test('should export createResolveCommand function', () => {
    expect(typeof createResolveCommand).toBe('function')
  })

  test('should create a command with correct name', () => {
    const cmd = createResolveCommand()
    expect(cmd.name()).toBe('resolve')
  })

  test('should have correct description', () => {
    const cmd = createResolveCommand()
    expect(cmd.description()).toContain('review threads')
  })

  test('should have help text', () => {
    const cmd = createResolveCommand()
    const helpText = cmd.helpInformation()
    expect(helpText).toContain('resolve')
  })

  test('should have help text with options', () => {
    const cmd = createResolveCommand()
    const helpText = cmd.helpInformation()
    expect(helpText).toContain('--thread')
    expect(helpText).toContain('--all')
  })
})
