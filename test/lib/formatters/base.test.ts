import type { OutputData } from '../../../src/lib/formatters/types'
import { describe, expect, test } from 'bun:test'
import { BaseFormatter } from '../../../src/lib/formatters/base'

// Concrete test implementation of BaseFormatter
class TestFormatter extends BaseFormatter {
  format(data: OutputData): string {
    this.validateData(data)
    return `Test: ${data.command}`
  }

  // Expose protected methods for testing
  public testEscape(text: string): string {
    return this.escape(text)
  }

  public testFormatTimestamp(timestamp: string): string {
    return this.formatTimestamp(timestamp)
  }
}

describe('BaseFormatter', () => {
  const validData: OutputData = {
    command: 'gh please test',
    timestamp: '2025-10-21T10:30:00Z',
    repository: 'owner/repo',
    data: { test: 'value' },
  }

  describe('validateData', () => {
    test('should not throw for valid data', () => {
      const formatter = new TestFormatter()
      expect(() => formatter.format(validData)).not.toThrow()
    })

    test('should throw when command is missing', () => {
      const formatter = new TestFormatter()
      const invalidData = { ...validData, command: '' }
      expect(() => formatter.format(invalidData)).toThrow('Output data missing required field: command')
    })

    test('should throw when timestamp is missing', () => {
      const formatter = new TestFormatter()
      const invalidData = { ...validData, timestamp: '' }
      expect(() => formatter.format(invalidData)).toThrow('Output data missing required field: timestamp')
    })

    test('should throw when data is undefined', () => {
      const formatter = new TestFormatter()
      const invalidData = { ...validData, data: undefined }
      expect(() => formatter.format(invalidData)).toThrow('Output data missing required field: data')
    })

    test('should throw when data is null', () => {
      const formatter = new TestFormatter()
      const invalidData = { ...validData, data: null }
      expect(() => formatter.format(invalidData)).toThrow('Output data missing required field: data')
    })

    test('should allow repository to be optional', () => {
      const formatter = new TestFormatter()
      const dataWithoutRepo = { ...validData }
      delete dataWithoutRepo.repository
      expect(() => formatter.format(dataWithoutRepo)).not.toThrow()
    })
  })

  describe('escape', () => {
    test('should return text unchanged by default', () => {
      const formatter = new TestFormatter()
      expect(formatter.testEscape('Hello World')).toBe('Hello World')
      expect(formatter.testEscape('<>&"\'|[]`')).toBe('<>&"\'|[]`')
    })
  })

  describe('formatTimestamp', () => {
    test('should return timestamp unchanged by default', () => {
      const formatter = new TestFormatter()
      const timestamp = '2025-10-21T10:30:00Z'
      expect(formatter.testFormatTimestamp(timestamp)).toBe(timestamp)
    })
  })

  describe('format', () => {
    test('should call abstract format method', () => {
      const formatter = new TestFormatter()
      const result = formatter.format(validData)
      expect(result).toBe('Test: gh please test')
    })
  })
})
