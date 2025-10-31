import type { QueryError } from '../../src/lib/jmespath-query'
import { describe, expect, test } from 'bun:test'
import { executeQuery } from '../../src/lib/jmespath-query'

describe('jmespath-query', () => {
  describe('executeQuery', () => {
    describe('basic queries', () => {
      test('should execute simple property access', () => {
        const data = { foo: 'bar' }
        const result = executeQuery(data, 'foo')
        expect(result).toBe('bar')
      })

      test('should execute nested property access', () => {
        const data = { foo: { bar: { baz: 'value' } } }
        const result = executeQuery(data, 'foo.bar.baz')
        expect(result).toBe('value')
      })

      test('should execute array index access', () => {
        const data = { items: [0, 1, 2, 3, 4] }
        const result = executeQuery(data, 'items[2]')
        expect(result).toBe(2)
      })

      test('should handle null result', () => {
        const data = { foo: 'bar' }
        const result = executeQuery(data, 'nonexistent')
        expect(result).toBeNull()
      })
    })

    describe('array operations', () => {
      test('should execute array slice', () => {
        const data = { items: [0, 1, 2, 3, 4] }
        const result = executeQuery(data, 'items[0:3]')
        expect(result).toEqual([0, 1, 2])
      })

      test('should execute array projection', () => {
        const data = { items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }] }
        const result = executeQuery(data, 'items[*].name')
        expect(result).toEqual(['a', 'b', 'c'])
      })

      test('should execute array filter', () => {
        const data = { items: [{ age: 10 }, { age: 20 }, { age: 30 }] }
        const result = executeQuery(data, 'items[?age > `15`]')
        expect(result).toEqual([{ age: 20 }, { age: 30 }])
      })
    })

    describe('pipe expressions', () => {
      test('should execute pipe expression', () => {
        const data = { foo: { bar: { baz: [0, 1, 2, 3, 4] } } }
        const result = executeQuery(data, 'foo.bar.baz | [0]')
        expect(result).toBe(0)
      })
    })

    describe('functions', () => {
      test('should execute length function', () => {
        const data = { items: [1, 2, 3, 4, 5] }
        const result = executeQuery(data, 'length(items)')
        expect(result).toBe(5)
      })

      test('should execute sort function', () => {
        const data = { items: [3, 1, 4, 1, 5, 9, 2, 6] }
        const result = executeQuery(data, 'sort(items)')
        expect(result).toEqual([1, 1, 2, 3, 4, 5, 6, 9])
      })
    })

    describe('error handling', () => {
      test('should throw QueryError for invalid syntax', () => {
        const data = { foo: 'bar' }
        expect(() => executeQuery(data, 'foo[')).toThrow()
      })

      test('should throw QueryError with descriptive message', () => {
        const data = { foo: 'bar' }
        try {
          executeQuery(data, 'foo[')
        }
        catch (error) {
          expect(error).toBeInstanceOf(Error)
          const queryError = error as QueryError
          expect(queryError.message).toContain('Invalid JMESPath query')
          expect(queryError.query).toBe('foo[')
        }
      })

      test('should handle empty query string', () => {
        const data = { foo: 'bar' }
        expect(() => executeQuery(data, '')).toThrow()
      })

      test('should handle undefined data', () => {
        expect(() => executeQuery(undefined, 'foo')).toThrow()
      })

      test('should handle null data', () => {
        expect(() => executeQuery(null, 'foo')).toThrow()
      })
    })

    describe('type safety', () => {
      test('should work with complex nested types', () => {
        interface User {
          name: string
          age: number
          address: {
            city: string
            zip: string
          }
        }

        const data: User = {
          name: 'John',
          age: 30,
          address: { city: 'NYC', zip: '10001' },
        }

        const result = executeQuery(data, 'address.city')
        expect(result).toBe('NYC')
      })

      test('should work with arrays of objects', () => {
        interface Product {
          id: number
          name: string
          price: number
        }

        const data: { products: Product[] } = {
          products: [
            { id: 1, name: 'A', price: 100 },
            { id: 2, name: 'B', price: 200 },
            { id: 3, name: 'C', price: 300 },
          ],
        }

        const result = executeQuery(data, 'products[*].name')
        expect(result).toEqual(['A', 'B', 'C'])
      })
    })

    describe('edge cases', () => {
      test('should handle empty object', () => {
        const data = {}
        const result = executeQuery(data, 'foo')
        expect(result).toBeNull()
      })

      test('should handle empty array', () => {
        const data = { items: [] }
        const result = executeQuery(data, 'items[0]')
        expect(result).toBeNull()
      })

      test('should handle deeply nested query', () => {
        const data = { a: { b: { c: { d: { e: { f: 'deep' } } } } } }
        const result = executeQuery(data, 'a.b.c.d.e.f')
        expect(result).toBe('deep')
      })
    })
  })
})
