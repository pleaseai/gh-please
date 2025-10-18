import { describe, expect, test } from 'bun:test'
import { createDependencyCommand } from '../../../src/commands/issue/dependency'

describe('dependency command', () => {
  test('should export createDependencyCommand function', () => {
    expect(typeof createDependencyCommand).toBe('function')
  })

  test('should create a command with correct name', () => {
    const cmd = createDependencyCommand()
    expect(cmd.name()).toBe('dependency')
  })

  test('should have correct description', () => {
    const cmd = createDependencyCommand()
    expect(cmd.description()).toContain('dependencies')
  })

  test('should have add subcommand', () => {
    const cmd = createDependencyCommand()
    const commands = cmd.commands || []
    const addCmd = commands.find(c => c.name() === 'add')
    expect(addCmd).toBeDefined()
  })

  test('should have remove subcommand', () => {
    const cmd = createDependencyCommand()
    const commands = cmd.commands || []
    const removeCmd = commands.find(c => c.name() === 'remove')
    expect(removeCmd).toBeDefined()
  })

  test('should have list subcommand', () => {
    const cmd = createDependencyCommand()
    const commands = cmd.commands || []
    const listCmd = commands.find(c => c.name() === 'list')
    expect(listCmd).toBeDefined()
  })
})
