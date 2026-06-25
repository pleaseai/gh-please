import type { Language } from '../types'

export interface IssueMessages {
  gettingParentIssue: (parentNumber: number) => string
  creatingSubIssue: string
  subIssueCreatedLinked: (childNumber: number, parentNumber: number) => string
  gettingNodeIds: string
  linkingSubIssue: (childNumber: number, parentNumber: number) => string
  subIssueLinked: string
  unlinkingSubIssue: (childNumber: number, parentNumber: number) => string
  subIssueUnlinked: string
  fetchingSubIssues: (parentNumber: number) => string
  noSubIssues: (parentNumber: number) => string
  foundSubIssues: (count: number) => string
  settingBlocker: (blockerNumber: number, issueNumber: number) => string
  dependencyAdded: string
  issueBlockedBy: (issueNumber: number, blockerNumber: number) => string
  removingBlocker: (blockerNumber: number, issueNumber: number) => string
  dependencyRemoved: string
  issueNoLongerBlocked: (issueNumber: number, blockerNumber: number) => string
  fetchingBlockers: (issueNumber: number) => string
  noBlockers: (issueNumber: number) => string
  issueBlockedByCount: (issueNumber: number, count: number) => string
  issueNumberInvalid: string
  errorPrefix: string
  unknownError: string
  parent: string
  child: string
  blocked: string
  blocker: string
  createFailed: (error: string) => string
  parseIssueFailed: string
  developStarting: (issue: number) => string
  developCheckingRepo: string
  developPromptClone: (owner: string, repo: string) => string
  developCloning: (owner: string, repo: string) => string
  developBranchReady: (branch: string) => string
  developWorktreeReady: (path: string) => string
  developCreateWorktree: (path: string) => string
  cleanupListing: string
  cleanupNothingToClean: string
  cleanupFoundPrunable: (count: number) => string
  cleanupRemoving: (path: string) => string
  cleanupRemoved: (count: number) => string
  // Issue type messages
  fetchingIssueTypes: string
  noIssueTypes: string
  issueTypeNotFound: (typeName: string) => string
  availableTypes: string
  creatingIssue: string
  issueCreated: (issueNumber: number, typeName?: string) => string
  settingIssueType: (issueNumber: number, typeName: string) => string
  issueTypeSet: string
  removingIssueType: (issueNumber: number) => string
  issueTypeRemoved: string
  typeRequired: string
}

export interface PrMessages {
  fetchingPrInfo: string
  creatingReply: (commentId: number, prNumber: number) => string
  bodyRequired: string
  usage: string
  bothRepoAndPr: string
  prNumberInvalid: string
  fetchingThreads: (prNumber: number) => string
  allResolved: string
  resolvingThreads: (count: number) => string
  resolvedThread: (path: string, line: number | null) => string
  resolvedCount: (count: number) => string
  resolvingThread: (threadId: string) => string
  threadResolved: string
  mustSpecify: string
  errorPrefix: string
  unknownError: string
  listingThreads: (prNumber: number) => string
  noThreads: string
  noUnresolvedThreads: string
  foundThreads: (total: number, resolved: number, unresolved: number) => string
  unresolvedThreadsHeader: (count: number) => string
  resolvedThreadsHeader: (count: number) => string
  threadAtLocation: (path: string, line: number | null) => string
  resolvedBy: (username: string) => string
  viewPr: string
}

export interface CommentMessages {
  fetchingComment: (commentId: number) => string
  updatingComment: (commentId: number) => string
  commentUpdated: string
  bodyRequired: string
  bodyEmpty: string
  usageIssue: string
  usagePr: string
  commentNotFound: (commentId: number) => string
  listingIssueComments: (issueNumber: number) => string
  listingReviewComments: (prNumber: number) => string
  noComments: string
  foundComments: (count: number) => string
  invalidIssueNumber: string
  invalidPrNumber: string
  errorPrefix: string
  unknownError: string
}

export interface PassthroughMessages {
  jsonParseError: string
  jsonNotSupported: string
  fieldsRequired: string
  deprecationWarning: string
}

export const issueMessages: Record<Language, IssueMessages> = {
  ko: {
    gettingParentIssue: (parentNumber: number) => `🔍 상위 이슈 #${parentNumber} 가져오는 중...`,
    creatingSubIssue: '📝 하위 이슈 생성 중...',
    subIssueCreatedLinked: (childNumber: number, parentNumber: number) => `✅ 하위 이슈 #${childNumber}가 생성되고 #${parentNumber}에 연결되었습니다!`,
    gettingNodeIds: '🔍 이슈 노드 ID 가져오는 중...',
    linkingSubIssue: (childNumber: number, parentNumber: number) => `🔗 #${childNumber}를 #${parentNumber}의 하위 이슈로 연결 중...`,
    subIssueLinked: '✅ 하위 이슈가 성공적으로 연결되었습니다!',
    unlinkingSubIssue: (childNumber: number, parentNumber: number) => `🔓 #${childNumber}와 #${parentNumber} 연결 해제 중...`,
    subIssueUnlinked: '✅ 하위 이슈가 성공적으로 연결 해제되었습니다!',
    fetchingSubIssues: (parentNumber: number) => `📋 #${parentNumber}의 하위 이슈 가져오는 중...`,
    noSubIssues: (parentNumber: number) => `#${parentNumber}에 대한 하위 이슈를 찾을 수 없습니다`,
    foundSubIssues: (count: number) => `\n✅ ${count}개의 하위 이슈를 찾았습니다:\n`,
    settingBlocker: (blockerNumber: number, issueNumber: number) => `🔗 #${blockerNumber}를 #${issueNumber}의 차단 이슈로 설정 중...`,
    dependencyAdded: '✅ 의존성이 성공적으로 추가되었습니다!',
    issueBlockedBy: (issueNumber: number, blockerNumber: number) => `   이슈 #${issueNumber}는 이제 #${blockerNumber}에 의해 차단됩니다`,
    removingBlocker: (blockerNumber: number, issueNumber: number) => `🔓 #${blockerNumber}를 #${issueNumber}의 차단 이슈에서 제거 중...`,
    dependencyRemoved: '✅ 의존성이 성공적으로 제거되었습니다!',
    issueNoLongerBlocked: (issueNumber: number, blockerNumber: number) => `   이슈 #${issueNumber}는 더 이상 #${blockerNumber}에 의해 차단되지 않습니다`,
    fetchingBlockers: (issueNumber: number) => `📋 #${issueNumber}의 차단 이슈 가져오는 중...`,
    noBlockers: (issueNumber: number) => `✅ #${issueNumber}에 대한 차단 이슈를 찾을 수 없습니다`,
    issueBlockedByCount: (issueNumber: number, count: number) => `\n⚠️  이슈 #${issueNumber}는 ${count}개의 이슈에 의해 차단되었습니다:\n`,
    issueNumberInvalid: '이슈 번호는 유효한 숫자여야 합니다',
    errorPrefix: '❌ 오류',
    unknownError: '알 수 없는 오류',
    parent: '상위',
    child: '하위',
    blocked: '차단됨',
    blocker: '차단 이슈',
    createFailed: (error: string) => `이슈 생성 실패: ${error}`,
    parseIssueFailed: '생성된 이슈 번호를 파싱하지 못했습니다',
    developStarting: (issue: number) => `🚀 이슈 #${issue}에서 개발 시작...`,
    developCheckingRepo: '🔍 저장소 확인 중...',
    developPromptClone: (owner: string, repo: string) => `저장소 ${owner}/${repo}를 ~/.please/repositories에 clone 하시겠습니까?`,
    developCloning: (owner: string, repo: string) => `📥 ${owner}/${repo}를 clone 중...`,
    developBranchReady: (branch: string) => `✅ 브랜치 ${branch}를 준비했습니다!`,
    developWorktreeReady: (_path: string) => `✅ Worktree 준비 완료! 다음 명령어로 이동하세요:`,
    developCreateWorktree: (path: string) => `📝 Worktree를 ${path}에 생성 중...`,
    cleanupListing: '📋 Worktree 목록 가져오는 중...',
    cleanupNothingToClean: '✅ 정리할 worktree가 없습니다.',
    cleanupFoundPrunable: (count: number) => `🧹 ${count}개의 prunable worktree를 발견했습니다.`,
    cleanupRemoving: (path: string) => `🗑️ ${path}를 제거 중...`,
    cleanupRemoved: (count: number) => `✅ ${count}개의 worktree를 제거했습니다!`,
    // Issue type messages
    fetchingIssueTypes: '🔍 이슈 타입 목록 가져오는 중...',
    noIssueTypes: '이 저장소에서 사용 가능한 이슈 타입을 찾을 수 없습니다',
    issueTypeNotFound: (typeName: string) => `이슈 타입 '${typeName}'을(를) 찾을 수 없습니다`,
    availableTypes: '\n사용 가능한 타입:',
    creatingIssue: '📝 이슈 생성 중...',
    issueCreated: (issueNumber: number, typeName?: string) =>
      typeName
        ? `✅ 이슈 #${issueNumber}가 생성되었습니다 (타입: ${typeName})`
        : `✅ 이슈 #${issueNumber}가 생성되었습니다`,
    settingIssueType: (issueNumber: number, typeName: string) => `🔖 이슈 #${issueNumber}의 타입을 '${typeName}'(으)로 설정 중...`,
    issueTypeSet: '✅ 이슈 타입이 설정되었습니다!',
    removingIssueType: (issueNumber: number) => `🔓 이슈 #${issueNumber}의 타입 제거 중...`,
    issueTypeRemoved: '✅ 이슈 타입이 제거되었습니다!',
    typeRequired: '❌ 오류: --type 또는 --type-id가 필요합니다',
  },
  en: {
    gettingParentIssue: (parentNumber: number) => `🔍 Getting parent issue #${parentNumber}...`,
    creatingSubIssue: '📝 Creating sub-issue...',
    subIssueCreatedLinked: (childNumber: number, parentNumber: number) => `✅ Sub-issue #${childNumber} created and linked to #${parentNumber}!`,
    gettingNodeIds: '🔍 Getting issue node IDs...',
    linkingSubIssue: (childNumber: number, parentNumber: number) => `🔗 Linking #${childNumber} as sub-issue of #${parentNumber}...`,
    subIssueLinked: '✅ Sub-issue linked successfully!',
    unlinkingSubIssue: (childNumber: number, parentNumber: number) => `🔓 Unlinking #${childNumber} from #${parentNumber}...`,
    subIssueUnlinked: '✅ Sub-issue unlinked successfully!',
    fetchingSubIssues: (parentNumber: number) => `📋 Fetching sub-issues of #${parentNumber}...`,
    noSubIssues: (parentNumber: number) => `No sub-issues found for #${parentNumber}`,
    foundSubIssues: (count: number) => `\n✅ Found ${count} sub-issue(s):\n`,
    settingBlocker: (blockerNumber: number, issueNumber: number) => `🔗 Setting #${blockerNumber} as blocker for #${issueNumber}...`,
    dependencyAdded: '✅ Dependency added successfully!',
    issueBlockedBy: (issueNumber: number, blockerNumber: number) => `   Issue #${issueNumber} is now blocked by #${blockerNumber}`,
    removingBlocker: (blockerNumber: number, issueNumber: number) => `🔓 Removing #${blockerNumber} as blocker for #${issueNumber}...`,
    dependencyRemoved: '✅ Dependency removed successfully!',
    issueNoLongerBlocked: (issueNumber: number, blockerNumber: number) => `   Issue #${issueNumber} is no longer blocked by #${blockerNumber}`,
    fetchingBlockers: (issueNumber: number) => `📋 Fetching blockers for #${issueNumber}...`,
    noBlockers: (issueNumber: number) => `✅ No blocking issues found for #${issueNumber}`,
    issueBlockedByCount: (issueNumber: number, count: number) => `\n⚠️  Issue #${issueNumber} is blocked by ${count} issue(s):\n`,
    issueNumberInvalid: 'Issue numbers must be valid',
    errorPrefix: '❌ Error',
    unknownError: 'Unknown error',
    parent: 'Parent',
    child: 'Child',
    blocked: 'Blocked',
    blocker: 'Blocker',
    createFailed: (error: string) => `Failed to create issue: ${error}`,
    parseIssueFailed: 'Failed to parse created issue number',
    developStarting: (issue: number) => `🚀 Starting development on issue #${issue}...`,
    developCheckingRepo: '🔍 Checking repository...',
    developPromptClone: (owner: string, repo: string) => `Clone ${owner}/${repo} to ~/.please/repositories?`,
    developCloning: (owner: string, repo: string) => `📥 Cloning ${owner}/${repo}...`,
    developBranchReady: (branch: string) => `✅ Branch ${branch} is ready!`,
    developWorktreeReady: (_path: string) => `✅ Worktree ready! Use this command to navigate:`,
    developCreateWorktree: (path: string) => `📝 Creating worktree at ${path}...`,
    cleanupListing: '📋 Listing worktrees...',
    cleanupNothingToClean: '✅ No worktrees to clean up.',
    cleanupFoundPrunable: (count: number) => `🧹 Found ${count} prunable worktree(s).`,
    cleanupRemoving: (path: string) => `🗑️ Removing ${path}...`,
    cleanupRemoved: (count: number) => `✅ Removed ${count} worktree(s)!`,
    // Issue type messages
    fetchingIssueTypes: '🔍 Fetching issue types...',
    noIssueTypes: 'No issue types available for this repository',
    issueTypeNotFound: (typeName: string) => `Issue type '${typeName}' not found`,
    availableTypes: '\nAvailable types:',
    creatingIssue: '📝 Creating issue...',
    issueCreated: (issueNumber: number, typeName?: string) =>
      typeName
        ? `✅ Issue #${issueNumber} created (type: ${typeName})`
        : `✅ Issue #${issueNumber} created`,
    settingIssueType: (issueNumber: number, typeName: string) => `🔖 Setting issue #${issueNumber} type to '${typeName}'...`,
    issueTypeSet: '✅ Issue type set successfully!',
    removingIssueType: (issueNumber: number) => `🔓 Removing type from issue #${issueNumber}...`,
    issueTypeRemoved: '✅ Issue type removed successfully!',
    typeRequired: '❌ Error: --type or --type-id is required',
  },
}

export const prMessages: Record<Language, PrMessages> = {
  ko: {
    fetchingPrInfo: '🔍 PR 정보 가져오는 중...',
    creatingReply: (commentId: number, prNumber: number) => `📝 PR #${prNumber}의 댓글 ${commentId}에 답글 생성 중...`,
    bodyRequired: '❌ 오류: --body가 필요합니다',
    usage: '   사용법: gh please pr review-reply <comment-id> --body \'답글 내용\'',
    bothRepoAndPr: '--repo와 --pr은 함께 지정해야 합니다',
    prNumberInvalid: 'PR 번호는 유효한 숫자여야 합니다',
    fetchingThreads: (prNumber: number) => `🔍 PR #${prNumber}의 리뷰 스레드 가져오는 중...`,
    allResolved: '✅ 모든 스레드가 이미 해결되었습니다!',
    resolvingThreads: (count: number) => `📝 ${count}개의 스레드 해결 중...`,
    resolvedThread: (path: string, line: number | null) => `  ✓ ${path}${line !== null ? `:${line}` : ''}의 스레드를 해결했습니다`,
    resolvedCount: (count: number) => `✅ ${count}개의 스레드를 해결했습니다!`,
    resolvingThread: (threadId: string) => `📝 스레드 ${threadId} 해결 중...`,
    threadResolved: '✅ 스레드가 해결되었습니다!',
    mustSpecify: '--thread <id> 또는 --all 중 하나를 지정해야 합니다',
    errorPrefix: '❌ 오류',
    unknownError: '예상치 못한 오류가 발생했습니다',
    listingThreads: (prNumber: number) => `📋 PR #${prNumber}의 리뷰 스레드 목록 가져오는 중...`,
    noThreads: '✅ 리뷰 스레드가 없습니다',
    noUnresolvedThreads: '✅ 미해결 리뷰 스레드가 없습니다',
    foundThreads: (total: number, resolved: number, unresolved: number) => `📋 PR 리뷰 스레드 (총 ${total}개: 해결됨 ${resolved}개, 미해결 ${unresolved}개)`,
    unresolvedThreadsHeader: (count: number) => `\n미해결 스레드 (${count}개):`,
    resolvedThreadsHeader: (count: number) => `\n해결된 스레드 (${count}개):`,
    threadAtLocation: (path: string, line: number | null) => `${path}${line !== null ? `:${line}` : ''}`,
    resolvedBy: (username: string) => `@${username}님이 해결함`,
    viewPr: '   View PR:',
  },
  en: {
    fetchingPrInfo: '🔍 Fetching PR information...',
    creatingReply: (commentId: number, prNumber: number) => `📝 Creating reply to comment ${commentId} on PR #${prNumber}...`,
    bodyRequired: '❌ Error: --body is required',
    usage: '   Usage: gh please pr review-reply <comment-id> --body \'your reply\'',
    bothRepoAndPr: 'Both --repo and --pr must be specified together',
    prNumberInvalid: 'PR number must be a valid number',
    fetchingThreads: (prNumber: number) => `🔍 Fetching review threads for PR #${prNumber}...`,
    allResolved: '✅ All threads are already resolved!',
    resolvingThreads: (count: number) => `📝 Resolving ${count} thread(s)...`,
    resolvedThread: (path: string, line: number | null) => `  ✓ Resolved thread at ${path}${line !== null ? `:${line}` : ''}`,
    resolvedCount: (count: number) => `✅ Resolved ${count} thread(s)!`,
    resolvingThread: (threadId: string) => `📝 Resolving thread ${threadId}...`,
    threadResolved: '✅ Thread resolved!',
    mustSpecify: 'Must specify either --thread <id> or --all',
    errorPrefix: '❌ Error',
    unknownError: '❌ An unexpected error occurred',
    listingThreads: (prNumber: number) => `📋 Listing review threads for PR #${prNumber}...`,
    noThreads: '✅ No review threads found',
    noUnresolvedThreads: '✅ No unresolved review threads found',
    foundThreads: (total: number, resolved: number, unresolved: number) => `📋 Review Threads for PR (Total: ${total}, Resolved: ${resolved}, Unresolved: ${unresolved})`,
    unresolvedThreadsHeader: (count: number) => `\nUnresolved Threads (${count}):`,
    resolvedThreadsHeader: (count: number) => `\nResolved Threads (${count}):`,
    threadAtLocation: (path: string, line: number | null) => `${path}${line !== null ? `:${line}` : ''}`,
    resolvedBy: (username: string) => `resolved by @${username}`,
    viewPr: '   View PR:',
  },
}

export function getIssueMessages(language: Language): IssueMessages {
  return issueMessages[language]
}

export function getPrMessages(language: Language): PrMessages {
  return prMessages[language]
}

export const commentMessages: Record<Language, CommentMessages> = {
  ko: {
    fetchingComment: (commentId: number) => `🔍 댓글 ${commentId} 가져오는 중...`,
    updatingComment: (commentId: number) => `📝 댓글 ${commentId} 업데이트 중...`,
    commentUpdated: '✅ 댓글이 성공적으로 업데이트되었습니다!',
    bodyRequired: '❌ 오류: --body 또는 --body-file이 필요합니다',
    bodyEmpty: '❌ 오류: 댓글 내용이 비어 있습니다',
    usageIssue: '   사용법: gh please issue comment edit <comment-id> --body \'내용\'',
    usagePr: '   사용법: gh please pr review-comment edit <comment-id> --body \'내용\'',
    commentNotFound: (commentId: number) => `댓글 ${commentId}를 찾을 수 없습니다`,
    listingIssueComments: (issueNumber: number) => `📋 이슈 #${issueNumber}의 댓글 가져오는 중...`,
    listingReviewComments: (prNumber: number) => `📋 PR #${prNumber}의 리뷰 댓글 가져오는 중...`,
    noComments: '✅ 댓글이 없습니다',
    foundComments: (count: number) => `\n✅ ${count}개의 댓글을 찾았습니다:\n`,
    invalidIssueNumber: '이슈 번호는 유효한 양수여야 합니다',
    invalidPrNumber: 'PR 번호는 유효한 양수여야 합니다',
    errorPrefix: '❌ 오류',
    unknownError: '예상치 못한 오류가 발생했습니다',
  },
  en: {
    fetchingComment: (commentId: number) => `🔍 Fetching comment ${commentId}...`,
    updatingComment: (commentId: number) => `📝 Updating comment ${commentId}...`,
    commentUpdated: '✅ Comment updated successfully!',
    bodyRequired: '❌ Error: --body or --body-file is required',
    bodyEmpty: '❌ Error: Comment body cannot be empty',
    usageIssue: '   Usage: gh please issue comment edit <comment-id> --body \'text\'',
    usagePr: '   Usage: gh please pr review-comment edit <comment-id> --body \'text\'',
    commentNotFound: (commentId: number) => `Comment ${commentId} not found`,
    listingIssueComments: (issueNumber: number) => `📋 Listing comments for issue #${issueNumber}...`,
    listingReviewComments: (prNumber: number) => `📋 Listing review comments for PR #${prNumber}...`,
    noComments: '✅ No comments found',
    foundComments: (count: number) => `\n✅ Found ${count} comment(s):\n`,
    invalidIssueNumber: 'Issue number must be a valid positive number',
    invalidPrNumber: 'PR number must be a valid positive number',
    errorPrefix: '❌ Error',
    unknownError: '❌ An unexpected error occurred',
  },
}

export function getCommentMessages(language: Language): CommentMessages {
  return commentMessages[language]
}

export interface RepoMessages {
  fetchingRepositories: string
  errorPrefix: string
  unknownError: string
}

const repoMessages: Record<Language, RepoMessages> = {
  ko: {
    fetchingRepositories: '📋 리포지토리 목록을 가져오는 중...',
    errorPrefix: '❌ 오류',
    unknownError: '예상치 못한 오류가 발생했습니다',
  },
  en: {
    fetchingRepositories: '📋 Fetching repositories...',
    errorPrefix: '❌ Error',
    unknownError: 'An unexpected error occurred',
  },
}

export function getRepoMessages(language: Language): RepoMessages {
  return repoMessages[language]
}

export interface PassthroughMessages {
  jsonParseError: string
  jsonNotSupported: string
  fieldsRequired: string
  deprecationWarning: string
  errorPrefix: string
  unknownError: string
}

export const passthroughMessages: Record<Language, PassthroughMessages> = {
  ko: {
    jsonParseError: '❌ JSON 출력을 파싱할 수 없습니다',
    jsonNotSupported: '❌ 이 명령어는 구조화된 출력을 지원하지 않습니다 (--json 플래그가 없음)',
    fieldsRequired: '❌ 이 명령어는 필드 지정이 필요하지만 필드 매핑이 아직 생성되지 않았습니다',
    deprecationWarning: '⚠️  네이티브 테이블 출력은 더 이상 사용되지 않습니다. 레거시 출력을 사용하려면 --format table을 사용하세요.\n   TOON 형식이 곧 기본값이 됩니다 (58.9% 토큰 감소).',
    errorPrefix: '❌ 오류',
    unknownError: '예상치 못한 오류가 발생했습니다',
  },
  en: {
    jsonParseError: '❌ Failed to parse JSON output',
    jsonNotSupported: '❌ This command does not support structured output (no --json flag available)',
    fieldsRequired: '❌ This command requires field specification but field mapping is not yet generated',
    deprecationWarning: '⚠️  Native table output is deprecated. Use --format table for legacy output.\n   TOON format will be default soon (58.9% token reduction).',
    errorPrefix: '❌ Error',
    unknownError: 'An unexpected error occurred',
  },
}

export function getPassthroughMessages(language: Language): PassthroughMessages {
  return passthroughMessages[language]
}

export interface AuthMessages {
  resolvingInstallation: string
  mintingToken: string
  appLoginSuccess: (installationId: string, expiresAt: string) => string
  tokenExpiresAt: (expiresAt: string) => string
  gitHelperConfigured: (hostname: string) => string
  gitHelperHint: (command: string) => string
  errorPrefix: string
  unknownError: string
}

const authMessages: Record<Language, AuthMessages> = {
  ko: {
    resolvingInstallation: '🔍 installation을 조회하는 중...',
    mintingToken: '🔑 installation 토큰을 발급하는 중...',
    appLoginSuccess: (id, exp) => `✅ GitHub App으로 로그인했습니다 (installation ${id}). 토큰 만료: ${exp}`,
    tokenExpiresAt: exp => `토큰 만료: ${exp}`,
    gitHelperConfigured: host => `✅ git credential helper를 설정했습니다 (${host}). git 작업 시 토큰이 자동 갱신됩니다.`,
    gitHelperHint: cmd => `💡 git 토큰 자동 갱신을 활성화하려면 실행하세요:\n   ${cmd}`,
    errorPrefix: '❌ 오류',
    unknownError: '예상치 못한 오류가 발생했습니다',
  },
  en: {
    resolvingInstallation: '🔍 Resolving installation...',
    mintingToken: '🔑 Minting installation token...',
    appLoginSuccess: (id, exp) => `✅ Logged in as GitHub App (installation ${id}). Token expires: ${exp}`,
    tokenExpiresAt: exp => `Token expires: ${exp}`,
    gitHelperConfigured: host => `✅ Configured git credential helper for ${host}. Tokens auto-refresh on git operations.`,
    gitHelperHint: cmd => `💡 To enable git token auto-refresh, run:\n   ${cmd}`,
    errorPrefix: '❌ Error',
    unknownError: 'An unexpected error occurred',
  },
}

export function getAuthMessages(language: Language): AuthMessages {
  return authMessages[language]
}

/**
 * Detect system language from environment variables
 */
export function detectSystemLanguage(): Language {
  const lang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || ''
  return lang.startsWith('ko') ? 'ko' : 'en'
}
