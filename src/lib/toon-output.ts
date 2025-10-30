import { encode } from '@byjohann/toon'

/**
 * Output format type for CLI commands
 */
export type OutputFormat = 'json' | 'toon'

/**
 * Encode data to TOON format with tab delimiters
 *
 * TOON (Token-Oriented Object Notation) is optimized for LLM token efficiency.
 * We explicitly override TOON's default delimiter (comma) to use tabs for maximum
 * token reduction in AI workflows.
 *
 * Why tab instead of TOON's comma default?
 * - Tab: 58.9% token reduction vs JSON
 * - Comma: 49.1% token reduction vs JSON
 * - Tab is single-token in most LLM tokenizers (GPT, Claude)
 * - AI-only consumption (not displayed to humans)
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
    delimiter: '\t', // Override TOON default (comma) for best tokenization (58.9% savings)
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
