import type { Formatter, OutputData } from './types'

/**
 * Abstract base class for all formatters
 * Provides common functionality and enforces the Formatter interface
 */
export abstract class BaseFormatter implements Formatter {
  /**
   * Format output data into a string representation
   * Must be implemented by concrete formatter classes
   */
  abstract format(data: OutputData): string

  /**
   * Helper to validate required fields in output data
   * Throws if validation fails
   */
  protected validateData(data: OutputData): void {
    if (!data.command) {
      throw new Error('Output data missing required field: command')
    }
    if (!data.timestamp) {
      throw new Error('Output data missing required field: timestamp')
    }
    if (data.data === undefined || data.data === null) {
      throw new Error('Output data missing required field: data')
    }
  }

  /**
   * Helper to escape special characters for specific format
   * Default implementation - override in subclasses as needed
   */
  protected escape(text: string): string {
    return text
  }

  /**
   * Helper to format timestamp in a readable way
   * Can be overridden by subclasses for format-specific formatting
   */
  protected formatTimestamp(timestamp: string): string {
    return timestamp
  }
}
