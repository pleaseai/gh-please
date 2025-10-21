import type {
  ActionResultOutput,
  DependencyListOutput,
  PluginListOutput,
  ReviewThreadOutput,
  SubIssueListOutput,
} from './types'

/**
 * Type guard for SubIssueListOutput
 */
export function isSubIssueListOutput(data: unknown): data is SubIssueListOutput {
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
export function isDependencyListOutput(data: unknown): data is DependencyListOutput {
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
export function isReviewThreadOutput(data: unknown): data is ReviewThreadOutput {
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
export function isPluginListOutput(data: unknown): data is PluginListOutput {
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
export function isActionResultOutput(data: unknown): data is ActionResultOutput {
  return (
    typeof data === 'object'
    && data !== null
    && 'action' in data
    && 'success' in data
    && 'result' in data
  )
}
