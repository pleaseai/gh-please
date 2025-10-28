import { describe, expect, test } from 'bun:test'
import { createIssueTypeCommand } from '../../../src/commands/issue/type'

describe('issue type command', () => {
  test('should export createIssueTypeCommand function', () => {
    expect(typeof createIssueTypeCommand).toBe('function')
  })

  test('should create a command with correct name', () => {
    const cmd = createIssueTypeCommand()
    expect(cmd.name()).toBe('type')
  })

  test('should have correct description', () => {
    const cmd = createIssueTypeCommand()
    expect(cmd.description()).toContain('type')
  })

  test('should have list subcommand', () => {
    const cmd = createIssueTypeCommand()
    const commands = cmd.commands || []
    const listCmd = commands.find(c => c.name() === 'list')
    expect(listCmd).toBeDefined()
  })

  test('should have set subcommand', () => {
    const cmd = createIssueTypeCommand()
    const commands = cmd.commands || []
    const setCmd = commands.find(c => c.name() === 'set')
    expect(setCmd).toBeDefined()
  })

  test('should have remove subcommand', () => {
    const cmd = createIssueTypeCommand()
    const commands = cmd.commands || []
    const removeCmd = commands.find(c => c.name() === 'remove')
    expect(removeCmd).toBeDefined()
  })

  test('list subcommand should have repo option', () => {
    const cmd = createIssueTypeCommand()
    const commands = cmd.commands || []
    const listCmd = commands.find(c => c.name() === 'list')
    expect(listCmd).toBeDefined()
    const options = listCmd?.options || []
    const repoOption = options.find(o => o.long === '--repo')
    expect(repoOption).toBeDefined()
  })

  test('list subcommand should have json option', () => {
    const cmd = createIssueTypeCommand()
    const commands = cmd.commands || []
    const listCmd = commands.find(c => c.name() === 'list')
    expect(listCmd).toBeDefined()
    const options = listCmd?.options || []
    const jsonOption = options.find(o => o.long === '--json')
    expect(jsonOption).toBeDefined()
  })

  test('set subcommand should have repo option', () => {
    const cmd = createIssueTypeCommand()
    const commands = cmd.commands || []
    const setCmd = commands.find(c => c.name() === 'set')
    expect(setCmd).toBeDefined()
    const options = setCmd?.options || []
    const repoOption = options.find(o => o.long === '--repo')
    expect(repoOption).toBeDefined()
  })

  test('set subcommand should have type option', () => {
    const cmd = createIssueTypeCommand()
    const commands = cmd.commands || []
    const setCmd = commands.find(c => c.name() === 'set')
    expect(setCmd).toBeDefined()
    const options = setCmd?.options || []
    const typeOption = options.find(o => o.long === '--type')
    expect(typeOption).toBeDefined()
  })

  test('set subcommand should have type-id option', () => {
    const cmd = createIssueTypeCommand()
    const commands = cmd.commands || []
    const setCmd = commands.find(c => c.name() === 'set')
    expect(setCmd).toBeDefined()
    const options = setCmd?.options || []
    const typeIdOption = options.find(o => o.long === '--type-id')
    expect(typeIdOption).toBeDefined()
  })

  test('remove subcommand should have repo option', () => {
    const cmd = createIssueTypeCommand()
    const commands = cmd.commands || []
    const removeCmd = commands.find(c => c.name() === 'remove')
    expect(removeCmd).toBeDefined()
    const options = removeCmd?.options || []
    const repoOption = options.find(o => o.long === '--repo')
    expect(repoOption).toBeDefined()
  })
})
