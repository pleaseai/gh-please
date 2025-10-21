import type { Formatter, OutputFormat } from './types'
import { HumanFormatter } from './human'
import { MarkdownFormatter } from './markdown'
import { XMLFormatter } from './xml'

/**
 * Supported output formats
 */
const SUPPORTED_FORMATS: readonly OutputFormat[] = ['human', 'markdown', 'xml'] as const

/**
 * Factory function to create a formatter instance based on the specified format
 *
 * @param format - The output format type ('human', 'markdown', or 'xml')
 * @returns A formatter instance implementing the Formatter interface
 *
 * @example
 * ```typescript
 * const formatter = createFormatter('markdown')
 * const output = formatter.format(outputData)
 * console.log(output)
 * ```
 */
export function createFormatter(format: OutputFormat): Formatter {
  switch (format) {
    case 'markdown':
      return new MarkdownFormatter()
    case 'xml':
      return new XMLFormatter()
    case 'human':
    default:
      return new HumanFormatter()
  }
}

/**
 * Check if a string is a valid output format
 */
function isValidFormat(format: string): format is OutputFormat {
  return SUPPORTED_FORMATS.includes(format as OutputFormat)
}

/**
 * Get the output format from command options or environment variable
 * Command-line flag takes precedence over environment variable
 *
 * @param optionFormat - Format from command-line option (e.g., --format markdown)
 * @returns The resolved output format, defaulting to 'human'
 *
 * @example
 * ```typescript
 * const format = getOutputFormat(options.format)
 * const formatter = createFormatter(format)
 * ```
 */
export function getOutputFormat(optionFormat?: string): OutputFormat {
  // Command-line flag takes precedence
  if (optionFormat) {
    const normalized = optionFormat.toLowerCase()
    if (isValidFormat(normalized)) {
      return normalized
    }
  }

  // Check environment variable
  const envFormat = process.env.GH_PLEASE_FORMAT?.toLowerCase()
  if (envFormat && isValidFormat(envFormat)) {
    return envFormat
  }

  // Default to human-readable
  return 'human'
}

export { BaseFormatter } from './base'

// Re-export types for convenience
export type {
  ActionResultOutput,
  DependencyListOutput,
  Formatter,
  OutputData,
  OutputFormat,
  PluginListOutput,
  ReviewThreadOutput,
  SubIssueListOutput,
} from './types'
