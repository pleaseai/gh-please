import type { JSONValue } from '@jmespath-community/jmespath'
import { search } from '@jmespath-community/jmespath'

/**
 * Custom error class for JMESPath query errors
 */
export class QueryError extends Error {
  public override cause?: Error

  constructor(
    message: string,
    public query: string,
    cause?: Error,
  ) {
    super(message)
    this.name = 'QueryError'
    this.cause = cause
  }
}

/**
 * Execute a JMESPath query on the provided data
 *
 * @param data - The JSON data to query (must be a valid object or array)
 * @param query - The JMESPath query string
 * @returns The result of the query execution
 * @throws {QueryError} If the query is invalid or data is null/undefined
 *
 * @example
 * ```typescript
 * const data = { foo: { bar: { baz: [0, 1, 2, 3, 4] } } }
 * const result = executeQuery(data, 'foo.bar.baz[2]')
 * console.log(result) // 2
 * ```
 *
 * @example
 * ```typescript
 * const data = { items: [{ name: 'a' }, { name: 'b' }] }
 * const result = executeQuery(data, 'items[*].name')
 * console.log(result) // ['a', 'b']
 * ```
 */
export function executeQuery<T = unknown>(
  data: unknown,
  query: string,
): T {
  // Validate inputs
  if (data === null || data === undefined) {
    throw new QueryError(
      'Invalid JMESPath query: data cannot be null or undefined',
      query,
    )
  }

  if (!query || query.trim() === '') {
    throw new QueryError(
      'Invalid JMESPath query: query string cannot be empty',
      query,
    )
  }

  try {
    // Execute the query using jmespath-community library
    // Cast data to JSONValue - the library accepts any valid JSON structure
    const result = search(data as JSONValue, query)
    return result as T
  }
  catch (error) {
    // Wrap library errors in our custom QueryError
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new QueryError(
      `Invalid JMESPath query: ${errorMessage}`,
      query,
      error instanceof Error ? error : undefined,
    )
  }
}
