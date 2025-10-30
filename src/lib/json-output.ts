/**
 * JSON output utilities for machine-readable CLI output
 *
 * Provides utilities for formatting command output as JSON or TOON format.
 * Follows GitHub CLI patterns and supports field selection.
 *
 * @module json-output
 */

import type { OutputFormat } from './toon-output'
import { pick } from 'es-toolkit'
import { outputToon } from './toon-output'

/**
 * Parse comma-separated field list from --json argument
 *
 * @param fieldString - Field list string (e.g., "number,title,state") or boolean true
 * @returns Array of field names, or null for all fields
 *
 * @example
 * ```typescript
 * parseFields('number,title,state')  // ['number', 'title', 'state']
 * parseFields('  number , title  ')  // ['number', 'title'] (trimmed)
 * parseFields(true)                  // null (all fields)
 * parseFields(undefined)             // null (all fields)
 * ```
 */
export function parseFields(fieldString?: string | boolean): string[] | null {
  if (typeof fieldString !== 'string')
    return null
  return fieldString.split(',').map(f => f.trim()).filter(Boolean)
}

/**
 * Filter object or array to include only specified fields
 *
 * Uses es-toolkit's pick function for optimal performance (3.43x faster than lodash).
 *
 * @param data - Object or array to filter
 * @param fields - Field names to include (null = all fields)
 * @returns Filtered data with only specified fields
 *
 * @example
 * ```typescript
 * const data = [{ a: 1, b: 2, c: 3 }]
 * filterFields(data, ['a', 'c'])  // [{ a: 1, c: 3 }]
 * filterFields(data, null)        // [{ a: 1, b: 2, c: 3 }] (all fields)
 *
 * const obj = { a: 1, b: 2 }
 * filterFields(obj, ['a'])  // { a: 1 }
 * ```
 */
export function filterFields<T extends Record<string, any>>(
  data: T | T[],
  fields: string[] | null,
): Pick<T, keyof T> | Pick<T, keyof T>[] {
  if (!fields) {
    return data
  }

  const filterObject = (obj: T) => pick(obj, fields as (keyof T)[])

  return Array.isArray(data) ? data.map(filterObject) : filterObject(data)
}

/**
 * Output data as formatted JSON to stdout
 *
 * Uses 2-space indentation for readability while maintaining machine-parseable format.
 *
 * @param data - Data to serialize as JSON
 *
 * @example
 * ```typescript
 * outputJson({ foo: 'bar' })
 * // Output:
 * // {
 * //   "foo": "bar"
 * // }
 *
 * outputJson([{ number: 1 }, { number: 2 }])
 * // Output:
 * // [
 * //   {
 * //     "number": 1
 * //   },
 * //   {
 * //     "number": 2
 * //   }
 * // ]
 * ```
 */
export function outputJson(data: any): void {
  console.log(JSON.stringify(data, null, 2))
}

/**
 * Output data in specified format (JSON or TOON) to stdout
 *
 * Unified output function that supports multiple formats with optional field filtering.
 * This is the preferred method for commands that support both JSON and TOON output.
 *
 * @param data - Data to serialize and output
 * @param format - Output format ('json' | 'toon'), defaults to 'json'
 * @param fields - Optional field filtering (null = all fields)
 *
 * @example
 * ```typescript
 * const issues = [{ number: 123, title: 'Test', state: 'OPEN', extra: 'data' }]
 *
 * // JSON output with all fields
 * outputData(issues, 'json')
 *
 * // TOON output with all fields (58.9% token savings)
 * outputData(issues, 'toon')
 *
 * // JSON output with field filtering
 * outputData(issues, 'json', ['number', 'title'])
 * // [{ "number": 123, "title": "Test" }]
 *
 * // TOON output with field filtering
 * outputData(issues, 'toon', ['number', 'title'])
 * // [1<TAB>]{number<TAB>title}:
 * //   123<TAB>Test
 * ```
 */
export function outputData(
  data: any,
  format: OutputFormat = 'json',
  fields?: string[] | null,
): void {
  // Validate format if explicitly provided
  if (format !== 'json') {
    validateFormat(format)
  }

  // Apply field filtering if specified
  const filteredData = fields ? filterFields(data, fields) : data

  // Output in requested format
  const outputFunction = format === 'toon' ? outputToon : outputJson
  outputFunction(filteredData)
}

/**
 * Valid output format values
 */
const VALID_FORMATS: readonly OutputFormat[] = ['json', 'toon'] as const

/**
 * Check if a string is a valid output format
 *
 * @param format - Format string to validate
 * @returns True if format is valid ('json' or 'toon')
 *
 * @example
 * ```typescript
 * isValidFormat('json')  // true
 * isValidFormat('toon')  // true
 * isValidFormat('xml')   // false
 * isValidFormat('JSON')  // false (case-sensitive)
 * ```
 */
export function isValidFormat(format: unknown): format is OutputFormat {
  return typeof format === 'string' && VALID_FORMATS.includes(format as OutputFormat)
}

/**
 * Validate output format and throw error if invalid
 *
 * @param format - Format string to validate
 * @returns The validated format
 * @throws {Error} If format is not valid
 *
 * @example
 * ```typescript
 * validateFormat('json')  // 'json'
 * validateFormat('toon')  // 'toon'
 * validateFormat('xml')   // throws Error
 * ```
 */
export function validateFormat(format: unknown): OutputFormat {
  if (!isValidFormat(format)) {
    const formatStr = format === undefined || format === null
      ? String(format)
      : `${format}`
    throw new Error(
      `Invalid output format: ${formatStr}. Supported formats: ${VALID_FORMATS.join(', ')}`,
    )
  }
  return format
}

/**
 * Determine if structured output should be used based on command options
 *
 * Helper function to simplify the common pattern across commands for determining
 * whether to use structured output (JSON/TOON) or human-readable output.
 *
 * @param options - Command options object
 * @param options.json - JSON output flag or field selection string
 * @param options.format - Output format ('json' or 'toon')
 * @returns True if structured output should be used
 *
 * @example
 * ```typescript
 * const shouldUseStructuredOutput = isStructuredOutput(options)
 * if (shouldUseStructuredOutput) {
 *   outputData(data, options.format || 'json', parseFields(options.json))
 * } else {
 *   // Human-readable output
 * }
 * ```
 */
export function isStructuredOutput(options: {
  json?: string | boolean
  format?: OutputFormat
}): boolean {
  return options.json !== undefined || options.format !== undefined
}

// Re-export OutputFormat type for convenience
export type { OutputFormat }
