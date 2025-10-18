import type { Language } from '../config/schema'

export interface InitMessages {
  intro: string
  selectLanguage: string
  languageKo: string
  languageEn: string
  configureSeverity: string
  severityLow: string
  severityMedium: string
  severityHigh: string
  configureMaxComments: string
  maxCommentsPlaceholder: string
  enableAutoReview: string
  enableDraftReview: string
  enableIssueWorkflow: string
  enableAutoTriage: string
  enableCodeWorkspace: string
  creating: string
  created: string
  cancelled: string
  setupComplete: string
  errorExists: string
  useForce: string
}

export interface AiMessages {
  triggeringTriage: (issueNumber: number) => string
  triagePosted: (issueNumber: number) => string
  triggeringInvestigate: (issueNumber: number) => string
  investigatePosted: (issueNumber: number) => string
  triggeringFix: (issueNumber: number) => string
  fixPosted: (issueNumber: number) => string
  triggeringReview: (prNumber: number) => string
  reviewPosted: (prNumber: number) => string
  triggeringApply: (prNumber: number) => string
  applyPosted: (prNumber: number) => string
  issueNumberInvalid: string
  prNumberInvalid: string
  errorPrefix: string
  unknownError: string
}

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
}

export const messages: Record<Language, InitMessages> = {
  ko: {
    intro: '🤖 PleaseAI 설정',
    selectLanguage: '봇 응답 언어를 선택하세요',
    languageKo: '🇰🇷 한국어 (Korean)',
    languageEn: '🇺🇸 English',
    configureSeverity: '리뷰 댓글의 최소 심각도를 선택하세요',
    severityLow: 'LOW - 모든 제안 포함',
    severityMedium: 'MEDIUM - 중요한 제안만',
    severityHigh: 'HIGH - 심각한 문제만',
    configureMaxComments: '최대 리뷰 댓글 수를 입력하세요',
    maxCommentsPlaceholder: '-1 (무제한)',
    enableAutoReview: 'PR이 열렸을 때 자동으로 코드 리뷰를 수행할까요?',
    enableDraftReview: 'Draft PR도 자동 리뷰에 포함할까요?',
    enableIssueWorkflow: 'Issue 워크플로우 (triage → investigate → fix)를 활성화할까요?',
    enableAutoTriage: '새 이슈를 자동으로 분류할까요?',
    enableCodeWorkspace: '코드 워크스페이스 기능을 활성화할까요?',
    creating: '.please/config.yml 생성 중',
    created: '✓ 설정이 성공적으로 생성되었습니다',
    cancelled: '설정이 취소되었습니다',
    setupComplete: '설정 완료!',
    errorExists: '❌ .please/config.yml 파일이 이미 존재합니다',
    useForce: '--force 플래그를 사용하여 덮어쓸 수 있습니다',
  },
  en: {
    intro: '🤖 PleaseAI Configuration',
    selectLanguage: 'Select bot response language',
    languageKo: '🇰🇷 한국어 (Korean)',
    languageEn: '🇺🇸 English',
    configureSeverity: 'Select minimum severity level for review comments',
    severityLow: 'LOW - Include all suggestions',
    severityMedium: 'MEDIUM - Important suggestions only',
    severityHigh: 'HIGH - Critical issues only',
    configureMaxComments: 'Enter maximum number of review comments',
    maxCommentsPlaceholder: '-1 (unlimited)',
    enableAutoReview: 'Automatically perform code review when PR is opened?',
    enableDraftReview: 'Include draft PRs in automatic reviews?',
    enableIssueWorkflow: 'Enable issue workflow (triage → investigate → fix)?',
    enableAutoTriage: 'Automatically triage new issues?',
    enableCodeWorkspace: 'Enable code workspace features?',
    creating: 'Creating .please/config.yml',
    created: '✓ Configuration created successfully',
    cancelled: 'Configuration cancelled',
    setupComplete: 'Setup complete!',
    errorExists: '❌ .please/config.yml already exists',
    useForce: 'Use --force flag to overwrite',
  },
}

export const aiMessages: Record<Language, AiMessages> = {
  ko: {
    triggeringTriage: (issueNumber: number) => `🤖 이슈 #${issueNumber}에 대한 PleaseAI 분류 트리거 중...`,
    triagePosted: (issueNumber: number) => `✅ 이슈 #${issueNumber}에 분류 요청이 게시되었습니다`,
    triggeringInvestigate: (issueNumber: number) => `🤖 이슈 #${issueNumber}에 대한 PleaseAI 조사 트리거 중...`,
    investigatePosted: (issueNumber: number) => `✅ 이슈 #${issueNumber}에 조사 요청이 게시되었습니다`,
    triggeringFix: (issueNumber: number) => `🤖 이슈 #${issueNumber}에 대한 PleaseAI 수정 트리거 중...`,
    fixPosted: (issueNumber: number) => `✅ 이슈 #${issueNumber}에 수정 요청이 게시되었습니다`,
    triggeringReview: (prNumber: number) => `🤖 PR #${prNumber}에 대한 PleaseAI 리뷰 트리거 중...`,
    reviewPosted: (prNumber: number) => `✅ PR #${prNumber}에 리뷰 요청이 게시되었습니다`,
    triggeringApply: (prNumber: number) => `🤖 PR #${prNumber}에 대한 PleaseAI 적용 트리거 중...`,
    applyPosted: (prNumber: number) => `✅ PR #${prNumber}에 적용 요청이 게시되었습니다`,
    issueNumberInvalid: '이슈 번호는 유효한 숫자여야 합니다',
    prNumberInvalid: 'PR 번호는 유효한 숫자여야 합니다',
    errorPrefix: '❌ 오류',
    unknownError: '알 수 없는 오류',
  },
  en: {
    triggeringTriage: (issueNumber: number) => `🤖 Triggering PleaseAI triage for issue #${issueNumber}...`,
    triagePosted: (issueNumber: number) => `✅ Triage request posted to issue #${issueNumber}`,
    triggeringInvestigate: (issueNumber: number) => `🤖 Triggering PleaseAI investigation for issue #${issueNumber}...`,
    investigatePosted: (issueNumber: number) => `✅ Investigation request posted to issue #${issueNumber}`,
    triggeringFix: (issueNumber: number) => `🤖 Triggering PleaseAI fix for issue #${issueNumber}...`,
    fixPosted: (issueNumber: number) => `✅ Fix request posted to issue #${issueNumber}`,
    triggeringReview: (prNumber: number) => `🤖 Triggering PleaseAI review for PR #${prNumber}...`,
    reviewPosted: (prNumber: number) => `✅ Review request posted to PR #${prNumber}`,
    triggeringApply: (prNumber: number) => `🤖 Triggering PleaseAI apply for PR #${prNumber}...`,
    applyPosted: (prNumber: number) => `✅ Apply request posted to PR #${prNumber}`,
    issueNumberInvalid: 'Issue number must be a valid number',
    prNumberInvalid: 'PR number must be a valid number',
    errorPrefix: '❌ Error',
    unknownError: 'Unknown error',
  },
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
  },
}

export function getMessages(language: Language): InitMessages {
  return messages[language]
}

export function getAiMessages(language: Language): AiMessages {
  return aiMessages[language]
}

export function getIssueMessages(language: Language): IssueMessages {
  return issueMessages[language]
}

export function getPrMessages(language: Language): PrMessages {
  return prMessages[language]
}

/**
 * Detect system language from environment variables
 */
export function detectSystemLanguage(): Language {
  const lang = process.env.LANG || process.env.LANGUAGE || process.env.LC_ALL || ''
  return lang.startsWith('ko') ? 'ko' : 'en'
}
