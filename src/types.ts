export interface PrInfo {
  number: number
  owner: string
  repo: string
}

export interface ReviewComment {
  id: number
  body: string
  user: {
    login: string
  }
  path: string
  line: number | null
  diff_hunk: string
  created_at: string
}

export interface ReplyOptions {
  commentId: number
  body: string
  prInfo: PrInfo
}

export interface GhApiError {
  message: string
  documentation_url?: string
}

export interface IssueInfo {
  number: number
  owner: string
  repo: string
  nodeId?: string
}

export interface SubIssue {
  number: number
  title: string
  state: 'OPEN' | 'CLOSED'
  nodeId: string
}

export interface BlockedByIssue {
  number: number
  title: string
  state: 'OPEN' | 'CLOSED'
  nodeId: string
}

export interface ReviewThread {
  nodeId: string
  isResolved: boolean
  path: string
  line: number | null
  firstCommentBody?: string
  firstCommentDatabaseId?: number
  resolvedBy?: string
}

export type PleaseTriggerType = 'triage' | 'investigate' | 'fix' | 'review' | 'apply'

export type Language = 'ko' | 'en'

export interface DevelopOptions {
  repo?: string // owner/repo format
  checkout?: boolean // Create branch and checkout (passes through to gh issue develop --checkout)
  worktree?: boolean // Create isolated worktree workspace (gh-please extension)
  base?: string // Base branch for gh issue develop
  name?: string // Custom branch name
}

export interface RepositoryInfo {
  owner: string
  repo: string
  localPath: string // ~/repos/owner/repo.git
  isBare: boolean
}

export interface WorktreeInfo {
  path: string // ~/worktrees/repo/branch
  branch: string
  commit: string
  prunable: boolean
}

export interface CommentInfo {
  id: number
  body: string
  user: {
    login: string
  }
  html_url: string
  created_at: string
  updated_at: string
}

export interface ReviewCommentInfo extends CommentInfo {
  path: string
  line: number | null
}

export interface EditCommentOptions {
  commentId: number
  body: string
  repo?: string
}

/**
 * GitHub Issue Type colors
 * @see https://docs.github.com/graphql/reference/enums#issuetypecolor
 */
export type IssueTypeColor = 'BLUE' | 'GREEN' | 'ORANGE' | 'PINK' | 'PURPLE' | 'RED' | 'YELLOW'

/**
 * GitHub Issue Type
 * Represents a custom issue type configured in a repository
 */
export interface IssueType {
  /** Node ID of the issue type */
  id: string
  /** Name of the issue type (e.g., "Bug", "Feature") */
  name: string
  /** Optional description */
  description?: string
  /** Color of the issue type */
  color: IssueTypeColor
  /** Whether the issue type is enabled */
  isEnabled: boolean
}

/**
 * Options for creating a new issue
 */
export interface CreateIssueOptions {
  /** Issue title (required) */
  title: string
  /** Issue body text */
  body?: string
  /** Repository in owner/repo format */
  repo?: string
  /** Issue type name (e.g., "Bug") - will be looked up */
  type?: string
  /** Issue type Node ID - used directly without lookup */
  typeId?: string
  /** Labels to add to the issue */
  labels?: string[]
  /** Assignees to add to the issue */
  assignees?: string[]
}
