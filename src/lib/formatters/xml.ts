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
 * XML formatter for structured hierarchical output
 * Generates valid XML 1.0 documents
 */
export class XMLFormatter extends BaseFormatter {
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
   * Format sub-issue list output as XML
   */
  private formatSubIssueList(data: OutputData & { data: SubIssueListOutput }): string {
    const { parent, subIssues, total } = data.data
    const lines: string[] = []

    lines.push('<?xml version="1.0" encoding="UTF-8"?>')
    lines.push('<sub-issue-list>')
    lines.push(this.formatMetadata(data, 2))
    lines.push('')
    lines.push(`  <parent number="${parent.number}" url="${this.escape(parent.url)}">`)
    lines.push(`    <title>${this.escape(parent.title)}</title>`)
    lines.push('  </parent>')
    lines.push('')
    lines.push('  <summary>')
    lines.push(`    <total>${total}</total>`)
    lines.push('  </summary>')
    lines.push('')
    lines.push('  <sub-issues>')

    for (const issue of subIssues) {
      lines.push(`    <issue number="${issue.number}" state="${issue.state}">`)
      lines.push(`      <title>${this.escape(issue.title)}</title>`)
      lines.push(`      <url>${this.escape(issue.url)}</url>`)
      lines.push('    </issue>')
    }

    lines.push('  </sub-issues>')
    lines.push('</sub-issue-list>')

    return lines.join('\n')
  }

  /**
   * Format dependency list output as XML
   */
  private formatDependencyList(data: OutputData & { data: DependencyListOutput }): string {
    const { issue, blockers, total } = data.data
    const lines: string[] = []

    lines.push('<?xml version="1.0" encoding="UTF-8"?>')
    lines.push('<dependency-list>')
    lines.push(this.formatMetadata(data, 2))
    lines.push('')
    lines.push(`  <issue number="${issue.number}" url="${this.escape(issue.url)}">`)
    lines.push(`    <title>${this.escape(issue.title)}</title>`)
    lines.push('  </issue>')
    lines.push('')
    lines.push('  <summary>')
    lines.push(`    <total>${total}</total>`)
    lines.push('  </summary>')
    lines.push('')
    lines.push('  <blockers>')

    for (const blocker of blockers) {
      lines.push(`    <issue number="${blocker.number}" state="${blocker.state}">`)
      lines.push(`      <title>${this.escape(blocker.title)}</title>`)
      lines.push(`      <url>${this.escape(blocker.url)}</url>`)
      lines.push('    </issue>')
    }

    lines.push('  </blockers>')
    lines.push('</dependency-list>')

    return lines.join('\n')
  }

  /**
   * Format review thread output as XML
   */
  private formatReviewThread(data: OutputData & { data: ReviewThreadOutput }): string {
    const { pr, threads, total, resolved } = data.data
    const lines: string[] = []

    lines.push('<?xml version="1.0" encoding="UTF-8"?>')
    lines.push('<review-thread-list>')
    lines.push(this.formatMetadata(data, 2))
    lines.push('')
    lines.push(`  <pull-request number="${pr.number}" url="${this.escape(pr.url)}">`)
    lines.push(`    <title>${this.escape(pr.title)}</title>`)
    lines.push('  </pull-request>')
    lines.push('')
    lines.push('  <summary>')
    lines.push(`    <total>${total}</total>`)
    lines.push(`    <resolved>${resolved}</resolved>`)
    lines.push(`    <unresolved>${total - resolved}</unresolved>`)
    lines.push('  </summary>')
    lines.push('')
    lines.push('  <threads>')

    for (const thread of threads) {
      const lineAttr = thread.line !== undefined ? ` line="${thread.line}"` : ''
      lines.push(`    <thread id="${this.escape(thread.id)}" resolved="${thread.isResolved}"${lineAttr}>`)
      lines.push(`      <path>${this.escape(thread.path)}</path>`)
      lines.push('    </thread>')
    }

    lines.push('  </threads>')
    lines.push('</review-thread-list>')

    return lines.join('\n')
  }

  /**
   * Format plugin list output as XML
   */
  private formatPluginList(data: OutputData & { data: PluginListOutput }): string {
    const { plugins, total } = data.data
    const lines: string[] = []

    lines.push('<?xml version="1.0" encoding="UTF-8"?>')
    lines.push('<plugin-list>')
    lines.push(this.formatMetadata(data, 2))
    lines.push('')
    lines.push('  <summary>')
    lines.push(`    <total>${total}</total>`)
    lines.push('  </summary>')
    lines.push('')
    lines.push('  <plugins>')

    for (const plugin of plugins) {
      lines.push(`    <plugin name="${this.escape(plugin.name)}" version="${plugin.version}" type="${plugin.type}">`)
      lines.push(`      <location>${this.escape(plugin.location)}</location>`)
      lines.push('    </plugin>')
    }

    lines.push('  </plugins>')
    lines.push('</plugin-list>')

    return lines.join('\n')
  }

  /**
   * Format action result output as XML
   */
  private formatActionResult(data: OutputData & { data: ActionResultOutput }): string {
    const { action, success, result, message } = data.data
    const lines: string[] = []

    lines.push('<?xml version="1.0" encoding="UTF-8"?>')
    lines.push(`<action-result action="${this.escape(action)}" success="${success}">`)
    lines.push(this.formatMetadata(data, 2))
    lines.push('')
    lines.push(`  <result type="${this.escape(result.type)}">`)
    lines.push(`    <id>${this.escape(String(result.id))}</id>`)

    if (result.url) {
      lines.push(`    <url>${this.escape(result.url)}</url>`)
    }

    if (result.metadata && Object.keys(result.metadata).length > 0) {
      lines.push('    <metadata>')
      for (const [key, value] of Object.entries(result.metadata)) {
        lines.push(`      <${this.escape(key)}>${this.escape(String(value))}</${this.escape(key)}>`)
      }
      lines.push('    </metadata>')
    }

    lines.push('  </result>')

    if (message) {
      lines.push(`  <message>${this.escape(message)}</message>`)
    }

    lines.push('</action-result>')

    return lines.join('\n')
  }

  /**
   * Format generic/unknown output as XML
   */
  private formatGeneric(data: OutputData): string {
    const lines: string[] = []

    lines.push('<?xml version="1.0" encoding="UTF-8"?>')
    lines.push('<command-output>')
    lines.push(this.formatMetadata(data, 2))
    lines.push('')
    lines.push('  <data>')
    lines.push(`    <![CDATA[${JSON.stringify(data.data, null, 2)}]]>`)
    lines.push('  </data>')
    lines.push('</command-output>')

    return lines.join('\n')
  }

  /**
   * Format metadata section as XML
   * @param data - Output data
   * @param indent - Number of spaces for indentation
   */
  private formatMetadata(data: OutputData, indent = 2): string {
    const lines: string[] = []
    const spaces = ' '.repeat(indent)

    lines.push(`${spaces}<metadata>`)
    lines.push(`${spaces}  <command>${this.escape(data.command)}</command>`)
    if (data.repository) {
      lines.push(`${spaces}  <repository>${this.escape(data.repository)}</repository>`)
    }
    lines.push(`${spaces}  <timestamp>${this.formatTimestamp(data.timestamp)}</timestamp>`)
    lines.push(`${spaces}</metadata>`)

    return lines.join('\n')
  }

  /**
   * Escape special XML characters
   */
  protected override escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }
}
