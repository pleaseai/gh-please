# Issue #4: Infrastructure - GraphQL/REST API Clients

## 개요

Issue: https://github.com/pleaseai/gh-please/issues/4

GraphQL, REST API, PleaseAI 트리거를 위한 공통 라이브러리 구축

## 분석 결과

### 기존 코드베이스 패턴

1. **런타임**: Bun (Node.js 아님)
2. **GitHub API 통신**: `gh` CLI를 `Bun.spawn()`으로 실행
3. **에러 처리**: exit code 확인 → stderr 파싱 → Error throw
4. **테스트**: Bun 테스트 프레임워크, AAA 패턴 (Arrange-Act-Assert)

### 기존 `github-api.ts` 패턴 예시

```typescript
export async function getCurrentPrInfo(): Promise<PrInfo> {
  const proc = Bun.spawn(['gh', 'pr', 'view', '--json', 'number,owner,repository'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to get PR info: ${error.trim()}`)
  }

  const data = JSON.parse(output)
  return parsePrInfo(data)
}
```

## GitHub API 조사 결과

### GraphQL API - Sub-issues

**필수 헤더**: `-H "GraphQL-Features: sub_issues"`

**Mutation 예시**:

```graphql
mutation addSubIssue {
  addSubIssue(input: { issueId: "$parent", subIssueId: "$child" }) {
    issue {
      title
    }
    subIssue {
      title
    }
  }
}
```

**중요**: Issue number가 아닌 node ID 사용 필요

### GraphQL API - Review Threads

**Mutation**:

```graphql
mutation ($threadId: ID!) {
  resolveReviewThread(input: { threadId: $threadId }) {
    thread {
      isResolved
    }
  }
}
```

### REST API - Issue Dependencies

**엔드포인트**:

- `POST /repos/{owner}/{repo}/issues/{issue}/dependencies`
- `DELETE /repos/{owner}/{repo}/issues/{issue}/dependencies/{blocker}`
- `GET /repos/{owner}/{repo}/issues/{issue}/dependencies`

**발표 시기**: 2025년 8월 (최신 기능)

## 구현 계획

### 파일 구조

```
src/lib/
├── github-graphql.ts    (NEW) - GraphQL 클라이언트
├── github-rest.ts       (NEW) - REST API 확장
├── please-trigger.ts    (NEW) - PleaseAI 트리거 헬퍼
└── github-api.ts        (EXTEND) - 공통 유틸리티 추가

src/types.ts             (EXTEND) - 타입 정의 추가

test/lib/
├── github-graphql.test.ts  (NEW)
├── github-rest.test.ts     (NEW)
└── please-trigger.test.ts  (NEW)
```

## 상세 구현 사양

### 1. `src/lib/github-graphql.ts` (신규 생성)

#### 함수 목록

```typescript
/**
 * GraphQL 쿼리 실행 (기본 래퍼)
 */
export async function executeGraphQL(
  query: string,
  variables: Record<string, any>,
  features?: string[]
): Promise<any>

/**
 * Issue 번호 → Node ID 변환
 */
export async function getIssueNodeId(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<string>

/**
 * PR 번호 → Node ID 변환
 */
export async function getPrNodeId(
  owner: string,
  repo: string,
  prNumber: number
): Promise<string>

/**
 * 하위 이슈 생성
 */
export async function createSubIssue(
  parentNodeId: string,
  title: string,
  body?: string
): Promise<{ nodeId: string, number: number }>

/**
 * 기존 이슈를 하위 이슈로 추가
 */
export async function addSubIssue(
  parentNodeId: string,
  childNodeId: string
): Promise<void>

/**
 * 하위 이슈 목록 조회
 */
export async function listSubIssues(
  parentNodeId: string
): Promise<Array<{
  number: number
  title: string
  state: string
  nodeId: string
}>>

/**
 * 리뷰 스레드 해결
 */
export async function resolveReviewThread(
  threadNodeId: string
): Promise<void>

/**
 * PR의 리뷰 스레드 목록
 */
export async function listReviewThreads(
  prNodeId: string
): Promise<Array<{
  id: string
  nodeId: string
  isResolved: boolean
  path: string
  line: number | null
}>>
```

#### 구현 세부사항

**executeGraphQL 구현**:

```typescript
export async function executeGraphQL(
  query: string,
  variables: Record<string, any>,
  features?: string[]
): Promise<any> {
  const args = ['api', 'graphql']

  // GraphQL features 헤더 추가 (예: sub_issues)
  if (features && features.length > 0) {
    args.push('-H', `GraphQL-Features: ${features.join(', ')}`)
  }

  args.push('-f', `query=${query}`)

  // Variables 추가
  for (const [key, value] of Object.entries(variables)) {
    args.push('-F', `${key}=${JSON.stringify(value)}`)
  }

  const proc = Bun.spawn(['gh', ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`GraphQL query failed: ${error.trim()}`)
  }

  const result = JSON.parse(output)

  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`)
  }

  return result.data
}
```

**Node ID 조회 쿼리**:

```graphql
query ($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    issue(number: $number) {
      id
    }
  }
}
```

**Sub-issue 생성 Mutation**:

```graphql
mutation($parentId: ID!, $title: String!, $body: String) {
  createIssue(input: { title: $title, body: $body }) {
    issue {
      id
      number
    }
  }
}
```

### 2. `src/lib/github-rest.ts` (신규 생성)

```typescript
/**
 * Issue에 blocked_by 의존성 추가
 */
export async function addIssueDependency(
  owner: string,
  repo: string,
  issueNumber: number,
  blockedByNumber: number
): Promise<void> {
  const endpoint = `/repos/${owner}/${repo}/issues/${issueNumber}/dependencies`

  const proc = Bun.spawn(
    [
      'gh',
      'api',
      '--method',
      'POST',
      '-H',
      'Accept: application/vnd.github+json',
      '-H',
      'X-GitHub-Api-Version: 2022-11-28',
      endpoint,
      '-f',
      `blocked_by=${blockedByNumber}`,
    ],
    {
      stdout: 'pipe',
      stderr: 'pipe',
    }
  )

  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to add dependency: ${error.trim()}`)
  }
}

/**
 * 의존성 제거
 */
export async function removeIssueDependency(
  owner: string,
  repo: string,
  issueNumber: number,
  blockerNumber: number
): Promise<void>

/**
 * 의존성 목록 조회
 */
export async function listIssueDependencies(
  owner: string,
  repo: string,
  issueNumber: number
): Promise<Array<{
  number: number
  title: string
  state: string
}>>
```

### 3. `src/lib/please-trigger.ts` (신규 생성)

```typescript
export type PleaseTriggerType = 'triage' | 'investigate' | 'fix' | 'review' | 'apply'

/**
 * 트리거 커멘트 본문 생성
 */
export function buildTriggerComment(type: PleaseTriggerType): string {
  return `/please ${type}`
}

/**
 * PleaseAI 트리거 실행 (이슈/PR에 코멘트 생성)
 */
export async function triggerPleaseAI(
  type: PleaseTriggerType,
  owner: string,
  repo: string,
  issueOrPrNumber: number
): Promise<void> {
  const body = buildTriggerComment(type)

  // github-api.ts의 createIssueComment 재사용
  await createIssueComment(owner, repo, issueOrPrNumber, body)

  console.log(`✅ PleaseAI ${type} trigger posted!`)
}
```

### 4. `src/lib/github-api.ts` 확장

기존 파일에 추가:

```typescript
/**
 * 현재 리포지토리 정보 조회
 */
export async function getRepoInfo(): Promise<{ owner: string, repo: string }> {
  const proc = Bun.spawn(['gh', 'repo', 'view', '--json', 'owner,name'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })

  const output = await new Response(proc.stdout).text()
  const exitCode = await proc.exited

  if (exitCode !== 0) {
    const error = await new Response(proc.stderr).text()
    throw new Error(`Failed to get repo info: ${error.trim()}`)
  }

  const data = JSON.parse(output)
  return {
    owner: data.owner.login,
    repo: data.name,
  }
}

/**
 * 이슈에 코멘트 생성
 */
export async function createIssueComment(
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<void>

/**
 * PR에 코멘트 생성
 */
export async function createPrComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<void>
```

### 5. `src/types.ts` 확장

```typescript
// 기존 타입 유지...

export interface IssueInfo {
  number: number
  owner: string
  repo: string
  nodeId?: string
}

export interface SubIssueCreateOptions {
  parentNodeId: string
  title: string
  body?: string
}

export interface IssueDependency {
  issueNumber: number
  blockedBy: number[]
}

export interface ReviewThread {
  id: string
  nodeId: string
  isResolved: boolean
  path: string
  line: number | null
}

export type PleaseTriggerType = 'triage' | 'investigate' | 'fix' | 'review' | 'apply'
```

## TDD 워크플로우

### Red-Green-Refactor 사이클

각 함수마다:

1. **Red**: 실패하는 테스트 작성
2. **Green**: 최소한의 코드로 테스트 통과
3. **Refactor**: 코드 개선 (테스트는 계속 통과)
4. **Commit**: 구조 변경과 기능 변경 분리 커밋

### 테스트 전략

```typescript
// test/lib/github-graphql.test.ts 예시
describe('github-graphql', () => {
  describe('executeGraphQL', () => {
    test('should execute GraphQL query via gh CLI', async () => {
      // Mock Bun.spawn 필요 (현재 Bun 테스트에서는 어려움)
      // 대안: 실제 gh CLI 호출하거나 integration test로 분류
    })

    test('should handle GraphQL errors', async () => {
      // 에러 케이스 테스트
    })
  })

  describe('getIssueNodeId', () => {
    test('should convert issue number to node ID', async () => {
      // Arrange: Mock repository query response
      // Act: Call getIssueNodeId
      // Assert: Verify node ID returned
    })
  })
})
```

### 테스트 커버리지 목표

- **lib/ 함수**: 90% 이상
- **Critical paths** (GraphQL 쿼리, 에러 처리): 100%
- **Happy path + Error path** 모두 테스트

## 구현 순서

### Phase 1: GraphQL 기반 구조 (2-3시간)

1. ✅ 문서 작성 (현재 단계)
2. `src/lib/github-graphql.ts` 생성
   - `executeGraphQL()` 구현 + 테스트
   - `getIssueNodeId()`, `getPrNodeId()` 구현 + 테스트
3. 타입 정의 (`src/types.ts`) 추가

### Phase 2: Sub-issue 관리 (1-2시간)

4. `createSubIssue()` 구현 + 테스트
5. `addSubIssue()` 구현 + 테스트
6. `listSubIssues()` 구현 + 테스트

### Phase 3: Review Thread 관리 (1시간)

7. `resolveReviewThread()` 구현 + 테스트
8. `listReviewThreads()` 구현 + 테스트

### Phase 4: REST API 의존성 (1-2시간)

9. `src/lib/github-rest.ts` 생성
10. `addIssueDependency()` 구현 + 테스트
11. `removeIssueDependency()` 구현 + 테스트
12. `listIssueDependencies()` 구현 + 테스트

### Phase 5: PleaseAI 트리거 (30분-1시간)

13. `src/lib/please-trigger.ts` 생성
14. `buildTriggerComment()` 구현 + 테스트
15. `triggerPleaseAI()` 구현 + 테스트

### Phase 6: GitHub API 확장 (1시간)

16. `github-api.ts` 확장
17. `getRepoInfo()` 구현 + 테스트
18. `createIssueComment()`, `createPrComment()` 구현 + 테스트

### Phase 7: 통합 테스트 & 문서화 (1시간)

19. 전체 테스트 실행 및 커버리지 확인
20. CLAUDE.md 업데이트 (새 라이브러리 사용법)
21. 최종 리뷰 및 PR 준비

## 커밋 전략

### 커밋 메시지 규칙 (@commitlint/config-conventional)

- `feat: add executeGraphQL function`
- `test: add tests for getIssueNodeId`
- `refactor: extract GraphQL error handling`
- `docs: update CLAUDE.md with new API clients`

### 커밋 단위

- **구조 변경** (refactor)와 **기능 변경** (feat) 분리
- 각 함수마다 test + implementation 페어로 커밋
- 모든 테스트 통과 후에만 커밋

## 성공 기준

- [ ] GraphQL client 8개 함수 구현 완료
- [ ] REST API client 3개 함수 구현 완료
- [ ] PleaseAI trigger 2개 함수 구현 완료
- [ ] GitHub API 3개 함수 확장 완료
- [ ] 타입 정의 5개 추가 완료
- [ ] 테스트 커버리지 90% 이상 달성
- [ ] 모든 테스트 통과
- [ ] 문서화 완료

## 리스크 및 고려사항

### 1. Bun.spawn 모킹 어려움

**문제**: Bun 테스트에서 Bun.spawn을 모킹하기 어려움

**대안**:

- Integration 테스트로 분류 (실제 gh CLI 사용)
- 또는 wrapper 함수 만들어서 모킹 가능하게

### 2. GraphQL Features 헤더

**중요**: Sub-issue 관련 API는 `GraphQL-Features: sub_issues` 헤더 필수

### 3. Node ID vs Issue Number

**주의**: GraphQL은 node ID 사용, REST는 issue number 사용

- 변환 함수 필수적으로 필요

### 4. API 권한

**필요 권한**:

- Repository: Contents - Read & Write
- Issues - Read & Write
- Pull Requests - Read & Write

## 참고 자료

- [GitHub GraphQL API - Mutations](https://docs.github.com/en/graphql/reference/mutations)
- [GitHub REST API - Issue Dependencies](https://docs.github.com/en/rest/issues/issue-dependencies)
- [Sub-issues Public Preview Discussion](https://github.com/orgs/community/discussions/148714)
- [Create GitHub issue hierarchy using the API](https://jessehouwing.net/create-github-issue-hierarchy-using-the-api/)

## 다음 단계

문서 검토 완료 후:

1. Plan mode 종료
2. TDD 사이클 시작 (Red-Green-Refactor)
3. Phase 1부터 순차적 구현
