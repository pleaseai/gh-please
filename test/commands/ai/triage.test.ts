import { describe, expect, test } from 'bun:test'
import { createTriageCommand } from '../../../src/commands/ai/triage'

describe('triage command', () => {
  test('should export createTriageCommand function', () => {
    expect(typeof createTriageCommand).toBe('function')
  })

  test('should create a command with correct name', () => {
    const cmd = createTriageCommand()
    expect(cmd.name()).toBe('triage')
  })

  test('should have correct description', () => {
    const cmd = createTriageCommand()
    expect(cmd.description()).toContain('PleaseAI')
  })

  test('should have help text', () => {
    const cmd = createTriageCommand()
    const helpText = cmd.helpInformation()
    expect(helpText).toContain('triage')
  })
})
