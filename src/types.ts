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
  id: string
  nodeId: string
  isResolved: boolean
  path: string
  line: number | null
}

export type PleaseTriggerType = 'triage' | 'investigate' | 'fix' | 'review' | 'apply'

export type Language = 'ko' | 'en'

export interface DevelopOptions {
  repo?: string // owner/repo format
  checkout?: boolean // Use checkout mode instead of worktree (default)
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
