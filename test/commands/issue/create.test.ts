import { describe, expect, test } from 'bun:test'
import { createIssueCreateCommand } from '../../../src/commands/issue/create'

describe('issue create command', () => {
  test('should export createIssueCreateCommand function', () => {
    expect(typeof createIssueCreateCommand).toBe('function')
  })

  test('should create a command with correct name', () => {
    const cmd = createIssueCreateCommand()
    expect(cmd.name()).toBe('create')
  })

  test('should have correct description', () => {
    const cmd = createIssueCreateCommand()
    expect(cmd.description()).toContain('issue')
  })

  test('should have title as required option', () => {
    const cmd = createIssueCreateCommand()
    const options = cmd.options || []
    const titleOption = options.find(o => o.long === '--title')
    expect(titleOption).toBeDefined()
    expect(titleOption?.required).toBe(true)
  })

  test('should have body option', () => {
    const cmd = createIssueCreateCommand()
    const options = cmd.options || []
    const bodyOption = options.find(o => o.long === '--body')
    expect(bodyOption).toBeDefined()
  })

  test('should have repo option', () => {
    const cmd = createIssueCreateCommand()
    const options = cmd.options || []
    const repoOption = options.find(o => o.long === '--repo')
    expect(repoOption).toBeDefined()
  })

  test('should have type option', () => {
    const cmd = createIssueCreateCommand()
    const options = cmd.options || []
    const typeOption = options.find(o => o.long === '--type')
    expect(typeOption).toBeDefined()
  })

  test('should have type-id option', () => {
    const cmd = createIssueCreateCommand()
    const options = cmd.options || []
    const typeIdOption = options.find(o => o.long === '--type-id')
    expect(typeIdOption).toBeDefined()
  })

  const expectedOptions = [
    '--json',
    '--label',
    '--assignee',
    '--milestone',
    '--project',
    '--parent',
    '--template',
    '--body-file',
  ]

  test.each(expectedOptions)('should have %s option', (optionName) => {
    const cmd = createIssueCreateCommand()
    const options = cmd.options || []
    const option = options.find(o => o.long === optionName)
    expect(option).toBeDefined()
  })

  describe('Error handling validation', () => {
    test('should export create command function', () => {
      // Verify the function exists and can be called
      expect(typeof createIssueCreateCommand).toBe('function')
      const cmd = createIssueCreateCommand()
      expect(cmd).toBeDefined()
      expect(cmd.name()).toBe('create')
    })

    test('should have body-file option with stdin support', () => {
      const cmd = createIssueCreateCommand()
      const options = cmd.options || []
      const bodyFileOption = options.find(o => o.long === '--body-file')
      expect(bodyFileOption).toBeDefined()
      // Description should mention stdin
      expect(bodyFileOption?.description).toContain('stdin')
    })

    test('should have template option', () => {
      const cmd = createIssueCreateCommand()
      const options = cmd.options || []
      const templateOption = options.find(o => o.long === '--template')
      expect(templateOption).toBeDefined()
      expect(templateOption?.description).toContain('template')
    })
  })
})
