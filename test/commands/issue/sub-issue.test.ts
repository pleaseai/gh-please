import { describe, expect, test } from 'bun:test'
import { createSubIssueCommand } from '../../../src/commands/issue/sub-issue'

describe('sub-issue command', () => {
  test('should export createSubIssueCommand function', () => {
    expect(typeof createSubIssueCommand).toBe('function')
  })

  test('should create a command with correct name', () => {
    const cmd = createSubIssueCommand()
    expect(cmd.name()).toBe('sub-issue')
  })

  test('should have correct description', () => {
    const cmd = createSubIssueCommand()
    expect(cmd.description()).toContain('sub-issue')
  })

  test('should have create subcommand', () => {
    const cmd = createSubIssueCommand()
    const commands = cmd.commands || []
    const createCmd = commands.find(c => c.name() === 'create')
    expect(createCmd).toBeDefined()
  })

  test('should have add subcommand', () => {
    const cmd = createSubIssueCommand()
    const commands = cmd.commands || []
    const addCmd = commands.find(c => c.name() === 'add')
    expect(addCmd).toBeDefined()
  })

  test('should have remove subcommand', () => {
    const cmd = createSubIssueCommand()
    const commands = cmd.commands || []
    const removeCmd = commands.find(c => c.name() === 'remove')
    expect(removeCmd).toBeDefined()
  })

  test('should have list subcommand', () => {
    const cmd = createSubIssueCommand()
    const commands = cmd.commands || []
    const listCmd = commands.find(c => c.name() === 'list')
    expect(listCmd).toBeDefined()
  })

  describe('create subcommand', () => {
    test('should have title as required option', () => {
      const cmd = createSubIssueCommand()
      const commands = cmd.commands || []
      const createCmd = commands.find(c => c.name() === 'create')
      const options = createCmd?.options || []
      const titleOption = options.find(o => o.long === '--title')
      expect(titleOption).toBeDefined()
      expect(titleOption?.required).toBe(true)
    })

    test('should have body option', () => {
      const cmd = createSubIssueCommand()
      const commands = cmd.commands || []
      const createCmd = commands.find(c => c.name() === 'create')
      const options = createCmd?.options || []
      const bodyOption = options.find(o => o.long === '--body')
      expect(bodyOption).toBeDefined()
    })

    test('should have repo option', () => {
      const cmd = createSubIssueCommand()
      const commands = cmd.commands || []
      const createCmd = commands.find(c => c.name() === 'create')
      const options = createCmd?.options || []
      const repoOption = options.find(o => o.long === '--repo')
      expect(repoOption).toBeDefined()
    })

    test('should have type option', () => {
      const cmd = createSubIssueCommand()
      const commands = cmd.commands || []
      const createCmd = commands.find(c => c.name() === 'create')
      const options = createCmd?.options || []
      const typeOption = options.find(o => o.long === '--type')
      expect(typeOption).toBeDefined()
    })

    test('should have type-id option', () => {
      const cmd = createSubIssueCommand()
      const commands = cmd.commands || []
      const createCmd = commands.find(c => c.name() === 'create')
      const options = createCmd?.options || []
      const typeIdOption = options.find(o => o.long === '--type-id')
      expect(typeIdOption).toBeDefined()
    })
  })
})
