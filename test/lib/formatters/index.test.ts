import { describe, expect, test } from 'bun:test'
import { createFormatter, getOutputFormat } from '../../../src/lib/formatters'
import { HumanFormatter } from '../../../src/lib/formatters/human'
import { MarkdownFormatter } from '../../../src/lib/formatters/markdown'
import { XMLFormatter } from '../../../src/lib/formatters/xml'

describe('formatters', () => {
  describe('createFormatter', () => {
    test('should create HumanFormatter for "human" format', () => {
      const formatter = createFormatter('human')
      expect(formatter).toBeInstanceOf(HumanFormatter)
    })

    test('should create MarkdownFormatter for "markdown" format', () => {
      const formatter = createFormatter('markdown')
      expect(formatter).toBeInstanceOf(MarkdownFormatter)
    })

    test('should create XMLFormatter for "xml" format', () => {
      const formatter = createFormatter('xml')
      expect(formatter).toBeInstanceOf(XMLFormatter)
    })

    test('should default to HumanFormatter for invalid format', () => {
      // @ts-expect-error - Testing invalid input
      const formatter = createFormatter('invalid')
      expect(formatter).toBeInstanceOf(HumanFormatter)
    })

    test('should create new instance each time', () => {
      const formatter1 = createFormatter('markdown')
      const formatter2 = createFormatter('markdown')
      expect(formatter1).not.toBe(formatter2)
    })
  })

  describe('getOutputFormat', () => {
    const originalEnv = process.env.GH_PLEASE_FORMAT

    // Clean up environment after each test
    const cleanup = () => {
      if (originalEnv !== undefined) {
        process.env.GH_PLEASE_FORMAT = originalEnv
      }
      else {
        delete process.env.GH_PLEASE_FORMAT
      }
    }

    test('should return format from option when provided', () => {
      expect(getOutputFormat('markdown')).toBe('markdown')
      expect(getOutputFormat('xml')).toBe('xml')
      expect(getOutputFormat('human')).toBe('human')
      cleanup()
    })

    test('should be case-insensitive for option format', () => {
      expect(getOutputFormat('MARKDOWN')).toBe('markdown')
      expect(getOutputFormat('Xml')).toBe('xml')
      expect(getOutputFormat('HuMaN')).toBe('human')
      cleanup()
    })

    test('should use environment variable when option not provided', () => {
      process.env.GH_PLEASE_FORMAT = 'markdown'
      expect(getOutputFormat()).toBe('markdown')

      process.env.GH_PLEASE_FORMAT = 'xml'
      expect(getOutputFormat()).toBe('xml')

      process.env.GH_PLEASE_FORMAT = 'human'
      expect(getOutputFormat()).toBe('human')

      cleanup()
    })

    test('should be case-insensitive for environment variable', () => {
      process.env.GH_PLEASE_FORMAT = 'MARKDOWN'
      expect(getOutputFormat()).toBe('markdown')

      process.env.GH_PLEASE_FORMAT = 'XmL'
      expect(getOutputFormat()).toBe('xml')

      cleanup()
    })

    test('should prioritize option over environment variable', () => {
      process.env.GH_PLEASE_FORMAT = 'xml'
      expect(getOutputFormat('markdown')).toBe('markdown')

      process.env.GH_PLEASE_FORMAT = 'human'
      expect(getOutputFormat('xml')).toBe('xml')

      cleanup()
    })

    test('should default to "human" when no option or env var', () => {
      delete process.env.GH_PLEASE_FORMAT
      expect(getOutputFormat()).toBe('human')
      cleanup()
    })

    test('should default to "human" for invalid option', () => {
      expect(getOutputFormat('invalid')).toBe('human')
      expect(getOutputFormat('json')).toBe('human')
      cleanup()
    })

    test('should default to "human" for invalid environment variable', () => {
      process.env.GH_PLEASE_FORMAT = 'invalid'
      expect(getOutputFormat()).toBe('human')

      process.env.GH_PLEASE_FORMAT = 'json'
      expect(getOutputFormat()).toBe('human')

      cleanup()
    })
  })
})
