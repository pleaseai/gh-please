import { encode } from '@byjohann/toon'

/**
 * Output format type for CLI commands
 */
export type OutputFormat = 'json' | 'toon'

/**
 * Encode data to TOON format with tab delimiters
 *
 * TOON (Token-Oriented Object Notation) is optimized for LLM token efficiency.
 * Using tab delimiters provides the best tokenization (58.9% reduction vs JSON).
 *
 * @param data - Data to encode (arrays, objects, primitives)
 * @returns TOON-formatted string
 *
 * @example
 * const data = [
 *   { number: 124, title: 'Test', state: 'OPEN' },
 *   { number: 125, title: 'Another', state: 'CLOSED' }
 * ]
 * const toon = encodeToon(data)
 * // Returns tab-delimited TOON format:
 * // [2<TAB>]{number<TAB>title<TAB>state}:
 * //   124<TAB>Test<TAB>OPEN
 * //   125<TAB>Another<TAB>CLOSED
 */
export function encodeToon(data: unknown): string {
  return encode(data, {
    delimiter: '\t', // Tab provides best tokenization (58.9% savings)
    indent: 2, // Standard 2-space indentation
  })
}

/**
 * Output data as TOON format to stdout
 *
 * This is the preferred output method for LLM consumption as it reduces
 * token count by ~58.9% compared to JSON.
 *
 * @param data - Data to serialize and output
 *
 * @example
 * outputToon([{ number: 123, title: 'Test' }])
 * // Outputs tab-delimited format to stdout:
 * // [1<TAB>]{number<TAB>title}:
 * //   123<TAB>Test
 */
export function outputToon(data: unknown): void {
  console.log(encodeToon(data))
}
