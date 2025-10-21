/**
 * Output format types for gh-please CLI
 */
export type OutputFormat = 'human' | 'markdown' | 'xml'

/**
 * Base formatter interface for all output formatters
 */
export interface Formatter {
  format: (data: OutputData) => string
}

/**
 * Base output data structure passed to formatters
 */
export interface OutputData {
  /** Command that generated this output (e.g., 'gh please issue sub-issue list') */
  command: string
  /** Repository in owner/repo format (optional) */
  repository?: string
  /** ISO 8601 timestamp when the command was executed */
  timestamp: string
  /** Command-specific data payload */
  data: unknown
}

/**
 * Sub-issue list output data
 */
export interface SubIssueListOutput {
  /** Parent issue information */
  parent: {
    number: number
    title: string
    url: string
  }
  /** List of sub-issues */
  subIssues: Array<{
    number: number
    title: string
    state: string
    url: string
  }>
  /** Total count of sub-issues */
  total: number
}

/**
 * Dependency list output data (blocked-by relationships)
 */
export interface DependencyListOutput {
  /** Issue being queried */
  issue: {
    number: number
    title: string
    url: string
  }
  /** List of blocking issues */
  blockers: Array<{
    number: number
    title: string
    state: string
    url: string
  }>
  /** Total count of blockers */
  total: number
}

/**
 * Review thread list/resolution output data
 */
export interface ReviewThreadOutput {
  /** Pull request information */
  pr: {
    number: number
    title: string
    url: string
  }
  /** List of review threads */
  threads: Array<{
    id: string
    path: string
    line?: number
    isResolved: boolean
  }>
  /** Total count of threads */
  total: number
  /** Count of resolved threads */
  resolved: number
}

/**
 * Plugin list output data
 */
export interface PluginListOutput {
  /** List of installed plugins */
  plugins: Array<{
    name: string
    version: string
    type: string
    location: string
  }>
  /** Total count of plugins */
  total: number
}

/**
 * Generic action result output (create, add, remove operations)
 */
export interface ActionResultOutput {
  /** Action performed (e.g., 'created', 'added', 'removed') */
  action: string
  /** Success status */
  success: boolean
  /** Result details */
  result: {
    /** Resource type (e.g., 'sub-issue', 'dependency', 'comment') */
    type: string
    /** Resource identifier (e.g., issue number, comment ID) */
    id: string | number
    /** Resource URL if applicable */
    url?: string
    /** Additional metadata */
    metadata?: Record<string, unknown>
  }
  /** Optional message */
  message?: string
}
