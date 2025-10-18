import { describe, expect, test } from 'bun:test'
import { createInvestigateCommand } from '../../../src/commands/ai/investigate'

describe('investigate command', () => {
  test('should export createInvestigateCommand function', () => {
    expect(typeof createInvestigateCommand).toBe('function')
  })

  test('should create a command with correct name', () => {
    const cmd = createInvestigateCommand()
    expect(cmd.name()).toBe('investigate')
  })

  test('should have correct description', () => {
    const cmd = createInvestigateCommand()
    expect(cmd.description()).toContain('PleaseAI')
  })

  test('should have help text', () => {
    const cmd = createInvestigateCommand()
    const helpText = cmd.helpInformation()
    expect(helpText).toContain('investigate')
  })
})
