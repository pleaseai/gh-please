/**
 * Integration tests for invalid format value handling
 *
 * Tests verify that commands properly validate the --format flag
 * and provide helpful error messages for invalid values.
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'bun:test'

describe('Format Validation Integration', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('Invalid format values', () => {
    test('should throw error for xml format', async () => {
      const { outputData } = await import('../../src/lib/json-output')

      expect(() => {
        // @ts-expect-error - intentionally passing invalid format
        outputData([], 'xml')
      }).toThrow('Invalid output format: xml')
    })

    test('should throw error for yaml format', async () => {
      const { outputData } = await import('../../src/lib/json-output')

      expect(() => {
        // @ts-expect-error - intentionally passing invalid format
        outputData([], 'yaml')
      }).toThrow('Supported formats: json, toon')
    })

    test('should throw error for case mismatch JSON', async () => {
      const { outputData } = await import('../../src/lib/json-output')

      expect(() => {
        // @ts-expect-error - intentionally passing invalid format
        outputData([], 'JSON')
      }).toThrow('Invalid output format: JSON')
    })

    test('should throw error for case mismatch TOON', async () => {
      const { outputData } = await import('../../src/lib/json-output')

      expect(() => {
        // @ts-expect-error - intentionally passing invalid format
        outputData([], 'TOON')
      }).toThrow('Invalid output format: TOON')
    })
  })

  describe('Validation in outputData', () => {
    test('should not validate when format is undefined (uses default)', async () => {
      const spy = vi.spyOn(console, 'log')
      const { outputData } = await import('../../src/lib/json-output')

      // Should use default 'json' format without validation error
      expect(() => {
        outputData([{ a: 1 }])
      }).not.toThrow()

      const output = spy.mock.calls[0][0] as string
      expect(output).toContain('{')
      expect(output).toContain('"a": 1')

      spy.mockRestore()
    })

    test('should accept valid json format', async () => {
      const spy = vi.spyOn(console, 'log')
      const { outputData } = await import('../../src/lib/json-output')

      expect(() => {
        outputData([{ a: 1 }], 'json')
      }).not.toThrow()

      const output = spy.mock.calls[0][0] as string
      expect(output).toContain('{')

      spy.mockRestore()
    })

    test('should accept valid toon format', async () => {
      const spy = vi.spyOn(console, 'log')
      const { outputData } = await import('../../src/lib/json-output')

      expect(() => {
        outputData([{ a: 1 }], 'toon')
      }).not.toThrow()

      const output = spy.mock.calls[0][0] as string
      expect(output).toContain('[1\t]')

      spy.mockRestore()
    })
  })

  describe('Command-level validation', () => {
    test('should validate format in command action handler', async () => {
      const { validateFormat } = await import('../../src/lib/json-output')

      // Simulate command receiving invalid format
      const mockOptions = { format: 'xml' as any }

      expect(() => {
        if (mockOptions.format) {
          validateFormat(mockOptions.format)
        }
      }).toThrow('Invalid output format: xml')
    })

    test('should not throw when format is valid', async () => {
      const { validateFormat } = await import('../../src/lib/json-output')

      const mockOptions = { format: 'json' as any }

      expect(() => {
        if (mockOptions.format) {
          validateFormat(mockOptions.format)
        }
      }).not.toThrow()
    })

    test('should not throw when format is undefined', async () => {
      const { validateFormat } = await import('../../src/lib/json-output')

      const mockOptions = {}

      expect(() => {
        // @ts-expect-error - format is undefined
        if (mockOptions.format) {
          validateFormat(mockOptions.format)
        }
      }).not.toThrow()
    })
  })
})
