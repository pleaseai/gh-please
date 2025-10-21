import type { OutputData } from './types'
import { BaseFormatter } from './base'

/**
 * Markdown formatter for LLM-friendly output
 * Generates GitHub-flavored Markdown with tables and metadata
 */
export class MarkdownFormatter extends BaseFormatter {
  format(data: OutputData): string {
    this.validateData(data)

    // TODO: Implement markdown formatting
    // This will be implemented in Phase 2
    return 'Markdown formatter not yet implemented'
  }

  /**
   * Escape special Markdown characters
   */
  protected override escape(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\|/g, '\\|')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/`/g, '\\`')
  }
}
