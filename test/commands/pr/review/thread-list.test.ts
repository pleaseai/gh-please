import { describe, expect, test } from 'bun:test'
import { createThreadListCommand } from '../../../../src/commands/pr/review/thread-list'

describe('thread list command', () => {
  test('should export createThreadListCommand function', () => {
    expect(typeof createThreadListCommand).toBe('function')
  })

  test('should create a command with correct name', () => {
    const cmd = createThreadListCommand()
    expect(cmd.name()).toBe('list')
  })

  test('should have correct description', () => {
    const cmd = createThreadListCommand()
    expect(cmd.description()).toContain('List review threads')
  })

  test('should have help text', () => {
    const cmd = createThreadListCommand()
    const helpText = cmd.helpInformation()
    expect(helpText).toContain('list')
  })

  test('should have help text with options', () => {
    const cmd = createThreadListCommand()
    const helpText = cmd.helpInformation()
    expect(helpText).toContain('--unresolved-only')
    expect(helpText).toContain('--repo')
  })

  test('should accept pr-number argument', () => {
    const cmd = createThreadListCommand()
    const helpText = cmd.helpInformation()
    expect(helpText).toContain('<pr-number>')
  })
})
