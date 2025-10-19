import { describe, expect, test } from 'bun:test'
import { createDevelopCommand } from '../../../src/commands/issue/develop'

describe('develop command', () => {
  test('should export createDevelopCommand function', () => {
    expect(typeof createDevelopCommand).toBe('function')
  })

  test('should create a command with correct name', () => {
    const cmd = createDevelopCommand()
    expect(cmd.name()).toBe('develop')
  })

  test('should have correct description', () => {
    const cmd = createDevelopCommand()
    expect(cmd.description()).toContain('issue')
  })

  test('should have develop alias "dev"', () => {
    const cmd = createDevelopCommand()
    expect(cmd.aliases()).toContain('dev')
  })

  test('should support --checkout flag', () => {
    const cmd = createDevelopCommand()
    const options = cmd.options
    const checkoutOption = options.find(opt => opt.long === '--checkout')
    expect(checkoutOption).toBeDefined()
  })

  test('should support --repo flag', () => {
    const cmd = createDevelopCommand()
    const options = cmd.options
    const repoOption = options.find(opt => opt.long === '--repo')
    expect(repoOption).toBeDefined()
  })

  test('should create command successfully', () => {
    const cmd = createDevelopCommand()
    // Verify command is properly constructed
    expect(cmd).toBeDefined()
    expect(cmd.name()).toBe('develop')
  })
})
