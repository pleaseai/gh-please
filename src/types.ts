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
  localPath: string // ~/repos/owner/repo.git (bare repo path)
  isBare: boolean
  gitDir?: string // Current repo's .git directory (for non-bare mode)
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

/**
 * GitHub App installation access token 발급 결과
 */
export interface InstallationTokenResult {
  /** installation access token (약 1시간 후 만료) */
  token: string
  /** 만료 시각 (ISO 8601) */
  expiresAt: string
}

/**
 * private key 해석 옵션
 */
export interface ResolvePrivateKeyOptions {
  /** 파일 경로. '-'이면 표준 입력에서 읽는다 */
  path?: string
  /** 폴백 환경 변수 이름 (기본: GH_APP_PRIVATE_KEY) */
  envVarName?: string
  /** 환경 변수 소스 (기본: process.env, 테스트 주입용) */
  env?: Record<string, string | undefined>
  /** 표준 입력 reader (테스트 주입용) */
  readStdin?: () => Promise<string>
}

/**
 * `auth login` 명령의 GitHub App 모드 옵션
 */
export interface AppLoginOptions {
  /** GitHub App ID 또는 Client ID */
  appId?: string
  /** private key 파일 경로 ('-'이면 stdin) */
  privateKey?: string
  /** 대상 installation ID */
  installationId?: string
  /** installation 자동 조회용 org/user 이름 */
  owner?: string
  /** GitHub 호스트명 (GHES 지원) */
  hostname?: string
  /** 토큰을 저장하지 않고 표준 출력으로 인쇄 */
  printToken?: boolean
  /** git credential helper 자동 설정 */
  setupGit?: boolean
}

/**
 * GitHub App 인증 설정 (~/.please/auth.json에 영속화).
 * 보안상 private key 값 자체는 절대 저장하지 않고 경로/환경 변수 참조만 저장한다.
 */
export interface AuthConfig {
  /** GitHub App ID 또는 Client ID */
  appId: string
  /** 해석된 installation ID */
  installationId: string
  /** private key 파일 경로 (값이 아닌 참조). 환경 변수 사용 시 생략 */
  privateKeyPath?: string
  /** GitHub 호스트명 (github.com이 아닌 경우) */
  hostname?: string
}

/**
 * Custom error class for JMESPath query errors
 * Provides detailed information about query failures
 */
export interface QueryErrorInfo {
  /** The error message */
  message: string
  /** The query that caused the error */
  query: string
  /** The original error cause (if any) */
  cause?: Error
}

/**
 * Options for executing JMESPath queries with additional configuration
 */
export interface QueryOptions {
  /** The JMESPath query string */
  query: string
  /** Whether to throw on null results (default: false) */
  throwOnNull?: boolean
  /** Custom error message prefix */
  errorPrefix?: string
}
