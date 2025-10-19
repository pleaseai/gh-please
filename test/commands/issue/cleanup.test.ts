import { describe, expect, test } from 'bun:test'
import { createCleanupCommand } from '../../../src/commands/issue/cleanup'

describe('cleanup command', () => {
  test('should export createCleanupCommand function', () => {
    expect(typeof createCleanupCommand).toBe('function')
  })

  test('should create a command with correct name', () => {
    const cmd = createCleanupCommand()
    expect(cmd.name()).toBe('cleanup')
  })

  test('should have correct description', () => {
    const cmd = createCleanupCommand()
    expect(cmd.description()).toContain('worktree')
  })

  test('should support --repo flag', () => {
    const cmd = createCleanupCommand()
    const options = cmd.options
    const repoOption = options.find(opt => opt.long === '--repo')
    expect(repoOption).toBeDefined()
  })

  test('should support --all flag', () => {
    const cmd = createCleanupCommand()
    const options = cmd.options
    const allOption = options.find(opt => opt.long === '--all')
    expect(allOption).toBeDefined()
  })

  test('should create command successfully', () => {
    const cmd = createCleanupCommand()
    expect(cmd).toBeDefined()
    expect(cmd.name()).toBe('cleanup')
  })
})
