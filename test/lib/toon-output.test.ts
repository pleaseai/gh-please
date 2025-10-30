import { decode } from '@byjohann/toon'
import { describe, expect, test, vi } from 'bun:test'
import { encodeToon, outputToon } from '../../src/lib/toon-output'

describe('toon-output', () => {
  describe('encodeToon', () => {
    test('should encode array of objects with tab delimiters', () => {
      const data = [
        { number: 124, title: 'Test Issue', state: 'OPEN' },
        { number: 125, title: 'Another Issue', state: 'CLOSED' },
      ]
      const result = encodeToon(data)

      // Should contain tab-delimited header
      expect(result).toContain('\t')
      expect(result).toContain('{number\ttitle\tstate}')

      // Should contain array length marker with tab
      expect(result).toContain('[2\t]')

      // Should contain data rows with tab delimiters
      expect(result).toContain('124\tTest Issue\tOPEN')
      expect(result).toContain('125\tAnother Issue\tCLOSED')
    })

    test('should handle empty arrays', () => {
      const result = encodeToon([])

      expect(result).toContain('[0')
      expect(result).toBe('[0\t]:')
    })

    test('should handle single object', () => {
      const data = { number: 123, title: 'Single Issue' }
      const result = encodeToon(data)

      expect(result).toContain('number')
      expect(result).toContain('title')
      expect(result).toContain('123')
      expect(result).toContain('Single Issue')
    })

    test('should handle nested objects with proper structure', () => {
      const data = [
        {
          issue: {
            number: 123,
            title: 'Test',
          },
        },
      ]
      const result = encodeToon(data)

      expect(result).toContain('issue')
      expect(result).toContain('number')
      expect(result).toContain('123')
    })

    test('should handle special characters in strings', () => {
      const data = [
        { title: 'Fix: bug with "quotes"' },
        { title: 'Issue with \'apostrophes\'' },
        { title: 'Contains\ttab character' },
      ]
      const result = encodeToon(data)

      // TOON quotes strings with special characters for safety
      expect(result).toContain('title')
      expect(result).toContain('[3\t]')

      // Verify round-trip encoding works
      const decoded = decode(result)
      expect(decoded).toEqual(data)
    })

    test('should handle URLs correctly', () => {
      const data = [
        {
          url: 'https://github.com/owner/repo/issues/123',
          title: 'Test Issue',
        },
      ]
      const result = encodeToon(data)

      expect(result).toContain('https://github.com/owner/repo/issues/123')
      expect(result).toContain('Test Issue')
    })

    test('should handle numbers correctly', () => {
      const data = [
        { count: 42, ratio: 3.14, zero: 0 },
      ]
      const result = encodeToon(data)

      expect(result).toContain('42')
      expect(result).toContain('3.14')
      expect(result).toContain('0')
    })

    test('should handle booleans correctly', () => {
      const data = [
        { isResolved: true, isOpen: false },
      ]
      const result = encodeToon(data)

      expect(result).toContain('true')
      expect(result).toContain('false')
    })

    test('should handle null values', () => {
      const data = [
        { value: null, name: 'Test' },
      ]
      const result = encodeToon(data)

      expect(result).toContain('null')
      expect(result).toContain('Test')
    })

    test('should produce output that can be decoded back', () => {
      const originalData = [
        { number: 124, title: 'Test', state: 'OPEN' },
        { number: 125, title: 'Another', state: 'CLOSED' },
      ]

      const encoded = encodeToon(originalData)
      const decoded = decode(encoded)

      expect(decoded).toEqual(originalData)
    })

    test('should handle complex real-world issue data', () => {
      const issueData = [
        {
          number: 124,
          title: 'Implement authentication module',
          state: 'OPEN',
          nodeId: 'I_kwDOABC123',
          url: 'https://github.com/owner/repo/issues/124',
        },
        {
          number: 125,
          title: 'Add unit tests',
          state: 'CLOSED',
          nodeId: 'I_kwDODEF456',
          url: 'https://github.com/owner/repo/issues/125',
        },
      ]

      const result = encodeToon(issueData)

      // Verify structure
      expect(result).toContain('[2\t]')
      expect(result).toContain('{number\ttitle\tstate\tnodeId\turl}')

      // Verify data can be decoded back
      const decoded = decode(result)
      expect(decoded).toEqual(issueData)
    })
  })

  describe('outputToon', () => {
    test('should output TOON to stdout', () => {
      const spy = vi.spyOn(console, 'log')
      const data = [{ a: 1, b: 2 }]

      outputToon(data)

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy.mock.calls[0][0]).toContain('[1\t]')
      expect(spy.mock.calls[0][0]).toContain('{a\tb}')

      spy.mockRestore()
    })

    test('should output empty arrays correctly', () => {
      const spy = vi.spyOn(console, 'log')

      outputToon([])

      expect(spy).toHaveBeenCalledWith('[0\t]:')

      spy.mockRestore()
    })

    test('should output complex data correctly', () => {
      const spy = vi.spyOn(console, 'log')
      const data = [
        { number: 123, title: 'Test', state: 'OPEN' },
      ]

      outputToon(data)

      const output = spy.mock.calls[0][0]
      expect(output).toContain('[1\t]')
      expect(output).toContain('{number\ttitle\tstate}')
      expect(output).toContain('123\tTest\tOPEN')

      spy.mockRestore()
    })
  })
})
