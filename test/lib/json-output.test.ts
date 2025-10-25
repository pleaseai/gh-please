import { describe, expect, test, vi } from 'bun:test'
import { filterFields, outputJson, parseFields } from '../../src/lib/json-output'

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
  })
})
