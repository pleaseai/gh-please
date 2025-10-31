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

/**
 * Apply a JMESPath query to data with error handling and exit on failure
 *
 * This is a convenience wrapper around executeQuery that:
 * 1. Returns data unchanged if no query is provided
 * 2. Executes the query if provided
 * 3. Handles errors by logging and exiting with code 1
 *
 * @param data - The data to query
 * @param query - Optional JMESPath query string
 * @param errorPrefix - Error message prefix for user-facing errors
 * @param unknownError - Generic error message for unknown errors
 * @returns The filtered data or original data if no query provided
 *
 * @example
 * ```typescript
 * const data = [{ name: 'foo', state: 'OPEN' }, { name: 'bar', state: 'CLOSED' }]
 * const filtered = applyQuery(data, "[?state=='OPEN']", "Query error", "Unknown error")
 * console.log(filtered) // [{ name: 'foo', state: 'OPEN' }]
 * ```
 */
export function applyQuery<T = unknown>(
  data: T,
  query: string | undefined,
  errorPrefix: string,
  unknownError: string,
): T {
  if (!query) {
    return data
  }

  try {
    return executeQuery<T>(data, query)
  }
  catch (error) {
    console.error(`${errorPrefix}: ${error instanceof Error ? error.message : unknownError}`)
    process.exit(1)
  }
}
