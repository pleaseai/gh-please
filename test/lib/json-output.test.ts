import { decode } from '@byjohann/toon'
import { describe, expect, test, vi } from 'bun:test'
import { filterFields, outputData, outputJson, parseFields } from '../../src/lib/json-output'

describe('json-output', () => {
  describe('parseFields', () => {
    test('should return null for boolean true', () => {
      expect(parseFields(true)).toBeNull()
    })

    test('should return null for undefined', () => {
      expect(parseFields(undefined)).toBeNull()
    })

    test('should parse comma-separated string', () => {
      expect(parseFields('number,title,state')).toEqual(['number', 'title', 'state'])
    })

    test('should trim whitespace from field names', () => {
      expect(parseFields('  number , title , state  ')).toEqual(['number', 'title', 'state'])
    })

    test('should handle single field', () => {
      expect(parseFields('number')).toEqual(['number'])
    })

    test('should filter out empty strings', () => {
      expect(parseFields('number,,title')).toEqual(['number', 'title'])
    })

    test('should return empty array for empty string', () => {
      expect(parseFields('')).toEqual([])
    })

    test('should return empty array for only commas', () => {
      expect(parseFields(',,,,')).toEqual([])
    })
  })

  describe('filterFields', () => {
    test('should return all data when fields is null', () => {
      const data = [{ a: 1, b: 2, c: 3 }]
      expect(filterFields(data, null)).toEqual(data)
    })

    test('should filter array of objects', () => {
      const data = [
        { a: 1, b: 2, c: 3 },
        { a: 4, b: 5, c: 6 },
      ]
      expect(filterFields(data, ['a', 'c'])).toEqual([
        { a: 1, c: 3 },
        { a: 4, c: 6 },
      ])
    })

    test('should filter single object', () => {
      const data = { a: 1, b: 2, c: 3 }
      expect(filterFields(data, ['a'])).toEqual({ a: 1 })
    })

    test('should handle missing fields gracefully', () => {
      const data = [{ a: 1, b: 2 }]
      expect(filterFields(data, ['a', 'c', 'd'])).toEqual([{ a: 1 }])
    })

    test('should return empty object when no fields match', () => {
      const data = { a: 1, b: 2 }
      expect(filterFields(data, ['x', 'y'])).toEqual({})
    })

    test('should handle empty array', () => {
      const data: any[] = []
      expect(filterFields(data, ['a'])).toEqual([])
    })

    test('should preserve field order from input data', () => {
      const data = { c: 3, a: 1, b: 2 }
      const result = filterFields(data, ['a', 'b'])
      // Note: Object key order in JavaScript is insertion order
      expect(Object.keys(result)).toEqual(['a', 'b'])
    })

    test('should handle nested objects without deep filtering', () => {
      const data = [{ a: 1, b: { nested: true }, c: 3 }]
      expect(filterFields(data, ['a', 'b'])).toEqual([{ a: 1, b: { nested: true } }])
    })
  })

  describe('outputJson', () => {
    test('should output formatted JSON to stdout', () => {
      const spy = vi.spyOn(console, 'log')
      outputJson({ foo: 'bar' })
      expect(spy).toHaveBeenCalledWith('{\n  "foo": "bar"\n}')
      spy.mockRestore()
    })

    test('should format arrays correctly', () => {
      const spy = vi.spyOn(console, 'log')
      outputJson([1, 2, 3])
      expect(spy).toHaveBeenCalledWith('[\n  1,\n  2,\n  3\n]')
      spy.mockRestore()
    })

    test('should handle nested objects', () => {
      const spy = vi.spyOn(console, 'log')
      outputJson({ a: { b: { c: 1 } } })
      expect(spy).toHaveBeenCalledWith('{\n  "a": {\n    "b": {\n      "c": 1\n    }\n  }\n}')
      spy.mockRestore()
    })

    test('should handle null values', () => {
      const spy = vi.spyOn(console, 'log')
      outputJson(null)
      expect(spy).toHaveBeenCalledWith('null')
      spy.mockRestore()
    })

    test('should handle array of objects', () => {
      const spy = vi.spyOn(console, 'log')
      outputJson([{ number: 1, title: 'Test' }])
      const expected = '[\n  {\n    "number": 1,\n    "title": "Test"\n  }\n]'
      expect(spy).toHaveBeenCalledWith(expected)
      spy.mockRestore()
    })
  })

  describe('outputData', () => {
    test('should output JSON format by default', () => {
      const spy = vi.spyOn(console, 'log')
      const data = { foo: 'bar' }

      outputData(data)

      expect(spy).toHaveBeenCalledWith('{\n  "foo": "bar"\n}')
      spy.mockRestore()
    })

    test('should output JSON format when explicitly specified', () => {
      const spy = vi.spyOn(console, 'log')
      const data = [{ number: 123 }]

      outputData(data, 'json')

      expect(spy).toHaveBeenCalledWith('[\n  {\n    "number": 123\n  }\n]')
      spy.mockRestore()
    })

    test('should output TOON format when specified', () => {
      const spy = vi.spyOn(console, 'log')
      const data = [{ number: 123, title: 'Test' }]

      outputData(data, 'toon')

      const output = spy.mock.calls[0][0]
      expect(output).toContain('[1\t]')
      expect(output).toContain('{number\ttitle}')
      expect(output).toContain('123\tTest')
      spy.mockRestore()
    })

    test('should apply field filtering with JSON format', () => {
      const spy = vi.spyOn(console, 'log')
      const data = [{ number: 123, title: 'Test', state: 'OPEN', extra: 'data' }]

      outputData(data, 'json', ['number', 'title'])

      const output = spy.mock.calls[0][0]
      expect(output).toContain('"number": 123')
      expect(output).toContain('"title": "Test"')
      expect(output).not.toContain('state')
      expect(output).not.toContain('extra')
      spy.mockRestore()
    })

    test('should apply field filtering with TOON format', () => {
      const spy = vi.spyOn(console, 'log')
      const data = [{ number: 123, title: 'Test', state: 'OPEN', extra: 'data' }]

      outputData(data, 'toon', ['number', 'title'])

      const output = spy.mock.calls[0][0]
      expect(output).toContain('{number\ttitle}')
      expect(output).not.toContain('state')
      expect(output).not.toContain('extra')

      // Verify decoding works
      const decoded = decode(output)
      expect(decoded).toEqual([{ number: 123, title: 'Test' }])
      spy.mockRestore()
    })

    test('should handle empty arrays in both formats', () => {
      const jsonSpy = vi.spyOn(console, 'log')
      outputData([], 'json')
      expect(jsonSpy).toHaveBeenCalledWith('[]')
      jsonSpy.mockRestore()

      const toonSpy = vi.spyOn(console, 'log')
      outputData([], 'toon')
      expect(toonSpy).toHaveBeenCalledWith('[0\t]:')
      toonSpy.mockRestore()
    })

    test('should handle null fields (no filtering)', () => {
      const spy = vi.spyOn(console, 'log')
      const data = [{ a: 1, b: 2, c: 3 }]

      outputData(data, 'json', null)

      const output = spy.mock.calls[0][0]
      expect(output).toContain('"a": 1')
      expect(output).toContain('"b": 2')
      expect(output).toContain('"c": 3')
      spy.mockRestore()
    })
  })

  describe('integration: parseFields + filterFields + outputJson', () => {
    test('should work together for typical use case', () => {
      const spy = vi.spyOn(console, 'log')

      // Simulating command output
      const data = [
        { number: 124, title: 'Implement auth', state: 'OPEN', nodeId: 'ABC123' },
        { number: 125, title: 'Add tests', state: 'CLOSED', nodeId: 'DEF456' },
      ]

      // User specifies: --json number,title
      const fields = parseFields('number,title')
      const filtered = filterFields(data, fields)
      outputJson(filtered)

      const expectedOutput = `[
  {
    "number": 124,
    "title": "Implement auth"
  },
  {
    "number": 125,
    "title": "Add tests"
  }
]`

      expect(spy).toHaveBeenCalledWith(expectedOutput)
      spy.mockRestore()
    })

    test('should output all fields when --json is boolean true', () => {
      const spy = vi.spyOn(console, 'log')

      const data = [{ number: 1, title: 'Test', state: 'OPEN' }]
      const fields = parseFields(true)
      const filtered = filterFields(data, fields)
      outputJson(filtered)

      expect(spy).toHaveBeenCalledWith(expect.stringContaining('"number": 1'))
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('"title": "Test"'))
      expect(spy).toHaveBeenCalledWith(expect.stringContaining('"state": "OPEN"'))
      spy.mockRestore()
    })

    test('should work with new outputData function', () => {
      const spy = vi.spyOn(console, 'log')

      const data = [
        { number: 124, title: 'Test 1', state: 'OPEN' },
        { number: 125, title: 'Test 2', state: 'CLOSED' },
      ]

      // User specifies: --format toon --json number,title
      const fields = parseFields('number,title')
      outputData(data, 'toon', fields)

      const output = spy.mock.calls[0][0]
      expect(output).toContain('[2\t]')
      expect(output).toContain('{number\ttitle}')
      expect(output).not.toContain('state')

      // Verify round-trip works
      const decoded = decode(output)
      expect(decoded).toEqual([
        { number: 124, title: 'Test 1' },
        { number: 125, title: 'Test 2' },
      ])

      spy.mockRestore()
    })
  })
})
