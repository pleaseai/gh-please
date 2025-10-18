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
