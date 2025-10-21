import type {
  ActionResultOutput,
  DependencyListOutput,
  OutputData,
  PluginListOutput,
  ReviewThreadOutput,
  SubIssueListOutput,
} from './types'
import { BaseFormatter } from './base'

/**
 * Markdown formatter for LLM-friendly output
 * Generates GitHub-flavored Markdown with tables and metadata
 */
export class MarkdownFormatter extends BaseFormatter {
  format(data: OutputData): string {
    this.validateData(data)

    // Determine the output type and format accordingly
    const outputData = data.data

    // Try to detect output type by structure
    if (this.isSubIssueListOutput(outputData)) {
      return this.formatSubIssueList(data as OutputData & { data: SubIssueListOutput })
    }
    else if (this.isDependencyListOutput(outputData)) {
      return this.formatDependencyList(data as OutputData & { data: DependencyListOutput })
    }
    else if (this.isReviewThreadOutput(outputData)) {
      return this.formatReviewThread(data as OutputData & { data: ReviewThreadOutput })
    }
    else if (this.isPluginListOutput(outputData)) {
      return this.formatPluginList(data as OutputData & { data: PluginListOutput })
    }
    else if (this.isActionResultOutput(outputData)) {
      return this.formatActionResult(data as OutputData & { data: ActionResultOutput })
    }

    // Fallback for unknown output types
    return this.formatGeneric(data)
  }

  /**
   * Type guard for SubIssueListOutput
   */
  private isSubIssueListOutput(data: unknown): data is SubIssueListOutput {
    return (
      typeof data === 'object'
      && data !== null
      && 'parent' in data
      && 'subIssues' in data
      && Array.isArray((data as any).subIssues)
    )
  }

  /**
   * Type guard for DependencyListOutput
   */
  private isDependencyListOutput(data: unknown): data is DependencyListOutput {
    return (
      typeof data === 'object'
      && data !== null
      && 'issue' in data
      && 'blockers' in data
      && Array.isArray((data as any).blockers)
    )
  }

  /**
   * Type guard for ReviewThreadOutput
   */
  private isReviewThreadOutput(data: unknown): data is ReviewThreadOutput {
    return (
      typeof data === 'object'
      && data !== null
      && 'pr' in data
      && 'threads' in data
      && Array.isArray((data as any).threads)
    )
  }

  /**
   * Type guard for PluginListOutput
   */
  private isPluginListOutput(data: unknown): data is PluginListOutput {
    return (
      typeof data === 'object'
      && data !== null
      && 'plugins' in data
      && Array.isArray((data as any).plugins)
    )
  }

  /**
   * Type guard for ActionResultOutput
   */
  private isActionResultOutput(data: unknown): data is ActionResultOutput {
    return (
      typeof data === 'object'
      && data !== null
      && 'action' in data
      && 'success' in data
      && 'result' in data
    )
  }

  /**
   * Format sub-issue list output
   */
  private formatSubIssueList(data: OutputData & { data: SubIssueListOutput }): string {
    const { parent, subIssues, total } = data.data
    const lines: string[] = []

    // Header
    lines.push(`## Sub-Issues for #${parent.number}: ${this.escape(parent.title)}`)
    lines.push('')
    lines.push(`**Total**: ${total} sub-issue${total !== 1 ? 's' : ''}`)
    lines.push('')

    // Table
    if (subIssues.length > 0) {
      lines.push('| Status | Number | Title |')
      lines.push('|--------|--------|-------|')
      for (const issue of subIssues) {
        lines.push(`| ${issue.state} | [#${issue.number}](${issue.url}) | ${this.escape(issue.title)} |`)
      }
    }
    else {
      lines.push('*No sub-issues found*')
    }

    lines.push('')
    lines.push(`**Parent Issue**: ${parent.url}`)

    // Add metadata footer
    lines.push('')
    lines.push(this.formatMetadata(data))

    return lines.join('\n')
  }

  /**
   * Format dependency list output
   */
  private formatDependencyList(data: OutputData & { data: DependencyListOutput }): string {
    const { issue, blockers, total } = data.data
    const lines: string[] = []

    // Header
    lines.push(`## Dependencies for #${issue.number}: ${this.escape(issue.title)}`)
    lines.push('')
    lines.push(`**Total**: ${total} blocker${total !== 1 ? 's' : ''}`)
    lines.push('')

    // Table
    if (blockers.length > 0) {
      lines.push('| Status | Number | Title |')
      lines.push('|--------|--------|-------|')
      for (const blocker of blockers) {
        lines.push(`| ${blocker.state} | [#${blocker.number}](${blocker.url}) | ${this.escape(blocker.title)} |`)
      }
    }
    else {
      lines.push('*No blocking issues found*')
    }

    lines.push('')
    lines.push(`**Issue**: ${issue.url}`)

    // Add metadata footer
    lines.push('')
    lines.push(this.formatMetadata(data))

    return lines.join('\n')
  }

  /**
   * Format review thread output
   */
  private formatReviewThread(data: OutputData & { data: ReviewThreadOutput }): string {
    const { pr, threads, total, resolved } = data.data
    const lines: string[] = []

    // Header
    lines.push(`## Review Threads for PR #${pr.number}: ${this.escape(pr.title)}`)
    lines.push('')
    lines.push(`**Total**: ${total} thread${total !== 1 ? 's' : ''} (${resolved} resolved, ${total - resolved} unresolved)`)
    lines.push('')

    // Table
    if (threads.length > 0) {
      lines.push('| Status | Thread ID | File | Line |')
      lines.push('|--------|-----------|------|------|')
      for (const thread of threads) {
        const status = thread.isResolved ? '✓ Resolved' : '○ Unresolved'
        const line = thread.line !== undefined ? thread.line.toString() : '-'
        lines.push(`| ${status} | \`${thread.id}\` | ${this.escape(thread.path)} | ${line} |`)
      }
    }
    else {
      lines.push('*No review threads found*')
    }

    lines.push('')
    lines.push(`**Pull Request**: ${pr.url}`)

    // Add metadata footer
    lines.push('')
    lines.push(this.formatMetadata(data))

    return lines.join('\n')
  }

  /**
   * Format plugin list output
   */
  private formatPluginList(data: OutputData & { data: PluginListOutput }): string {
    const { plugins, total } = data.data
    const lines: string[] = []

    // Header
    lines.push('## Installed Plugins')
    lines.push('')
    lines.push(`**Total**: ${total} plugin${total !== 1 ? 's' : ''}`)
    lines.push('')

    // Table
    if (plugins.length > 0) {
      lines.push('| Name | Version | Type | Location |')
      lines.push('|------|---------|------|----------|')
      for (const plugin of plugins) {
        lines.push(`| ${this.escape(plugin.name)} | ${plugin.version} | ${plugin.type} | ${this.escape(plugin.location)} |`)
      }
    }
    else {
      lines.push('*No plugins installed*')
    }

    // Add metadata footer
    lines.push('')
    lines.push(this.formatMetadata(data))

    return lines.join('\n')
  }

  /**
   * Format action result output
   */
  private formatActionResult(data: OutputData & { data: ActionResultOutput }): string {
    const { action, success, result, message } = data.data
    const lines: string[] = []

    // Header
    const status = success ? '✓ Success' : '✗ Failed'
    lines.push(`## ${status}: ${action}`)
    lines.push('')

    // Result details
    lines.push('**Result**:')
    lines.push(`- Type: ${result.type}`)
    lines.push(`- ID: ${result.id}`)
    if (result.url) {
      lines.push(`- URL: ${result.url}`)
    }

    // Metadata
    if (result.metadata && Object.keys(result.metadata).length > 0) {
      lines.push('')
      lines.push('**Additional Details**:')
      for (const [key, value] of Object.entries(result.metadata)) {
        lines.push(`- ${key}: ${value}`)
      }
    }

    // Message
    if (message) {
      lines.push('')
      lines.push(`**Message**: ${this.escape(message)}`)
    }

    // Add metadata footer
    lines.push('')
    lines.push(this.formatMetadata(data))

    return lines.join('\n')
  }

  /**
   * Format generic/unknown output
   */
  private formatGeneric(data: OutputData): string {
    const lines: string[] = []

    lines.push('## Command Output')
    lines.push('')
    lines.push('```json')
    lines.push(JSON.stringify(data.data, null, 2))
    lines.push('```')

    // Add metadata footer
    lines.push('')
    lines.push(this.formatMetadata(data))

    return lines.join('\n')
  }

  /**
   * Format metadata footer section
   */
  private formatMetadata(data: OutputData): string {
    const lines: string[] = []

    lines.push('---')
    lines.push('**Metadata**')
    lines.push(`- Command: \`${data.command}\``)
    if (data.repository) {
      lines.push(`- Repository: ${data.repository}`)
    }
    lines.push(`- Timestamp: ${this.formatTimestamp(data.timestamp)}`)

    return lines.join('\n')
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
